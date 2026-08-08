import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { openDB } from 'idb'
import { AccountType } from '6-shared/types'
import {
  makeAccount,
  makeInstrument,
  makeStore,
  makeUser,
} from 'zerro-core/support/testing/zenmoneyTestData'
import type { TDataStore } from '6-shared/types'
import { createReplicaStorage, type ReplicaStorage } from './replicaStorage'

describe('ReplicaStorage', () => {
  it('initializes and hydrates the sole replica from a full snapshot', async () => {
    const dbName = uniqueDatabaseName()
    const snapshot = validSnapshot(100, 'Cash')
    const writer = createReplicaStorage(dbName)

    await seedReplica(writer, snapshot)

    const reader = createReplicaStorage(dbName)
    await expect(reader.loadCurrent()).resolves.toEqual({
      rootUserId: 7,
      base: snapshot,
      outbox: { status: 'ready', commands: [] },
    })
  })

  it('atomically commits canonical changes and the remaining outbox', async () => {
    const storage = createReplicaStorage(uniqueDatabaseName())
    const before = validSnapshot(100, 'Cash')
    const after = validSnapshot(200, 'Wallet')
    const outbox = [command(123)]
    await seedReplica(storage, before)

    await storage.commitCanonical({ before, after, outbox, pushed: true })

    await expect(storage.loadCurrent()).resolves.toEqual({
      rootUserId: 7,
      base: after,
      outbox: { status: 'ready', commands: outbox },
    })
    await expect(storage.listHistory({ limit: 10 })).resolves.toMatchObject({
      entries: [
        { sequence: 2, kind: 'transition', pushed: true },
        { sequence: 1, kind: 'checkpoint', reason: 'full-sync' },
      ],
    })
  })

  it('advances a cursor-only pull without adding a history entry', async () => {
    const storage = createReplicaStorage(uniqueDatabaseName())
    const before = validSnapshot(100, 'Cash')
    const after = validSnapshot(200, 'Cash')
    await seedReplica(storage, before)

    await storage.commitCanonical({ before, after, outbox: [], pushed: false })

    await expect(storage.loadCurrent()).resolves.toMatchObject({ base: after })
    await expect(storage.listHistory({ limit: 10 })).resolves.toMatchObject({
      entries: [{ sequence: 1, kind: 'checkpoint' }],
    })
  })

  it('loads an historical state by sequence without hydrating all history', async () => {
    const storage = createReplicaStorage(uniqueDatabaseName())
    const first = validSnapshot(100, 'Cash')
    const second = validSnapshot(200, 'Wallet')
    const third = validSnapshot(300, 'Current')
    await seedReplica(storage, first)
    await storage.commitCanonical({
      before: first,
      after: second,
      outbox: [],
      pushed: false,
    })
    await storage.commitCanonical({
      before: second,
      after: third,
      outbox: [],
      pushed: true,
    })

    await expect(storage.loadHistoricalState(2)).resolves.toEqual(second)
    await expect(storage.listHistory({ limit: 2 })).resolves.toMatchObject({
      entries: [{ sequence: 3 }, { sequence: 2 }],
      nextBeforeSequence: 2,
    })
    const lastPage = await storage.listHistory({
      limit: 2,
      beforeSequence: 2,
    })
    expect(lastPage.entries).toMatchObject([{ sequence: 1 }])
    expect(lastPage.nextBeforeSequence).toBeUndefined()
  })

  it('rejects a live journal with a missing sequence', async () => {
    const dbName = uniqueDatabaseName()
    const storage = createReplicaStorage(dbName)
    const first = validSnapshot(100, 'Cash')
    const second = validSnapshot(200, 'Wallet')
    const third = validSnapshot(300, 'Current')
    await seedReplica(storage, first)
    await storage.commitCanonical({
      before: first,
      after: second,
      outbox: [],
      pushed: false,
    })
    await storage.commitCanonical({
      before: second,
      after: third,
      outbox: [],
      pushed: false,
    })
    const db = await openDB(dbName, 2)
    await db.delete('journalEntries', [7, 2])
    db.close()

    await expect(storage.loadCurrent()).rejects.toThrow(
      'Replica journal sequence is missing'
    )
  })

  it('compacts one bounded oldest prefix and keeps the live state intact', async () => {
    const storage = createReplicaStorage(uniqueDatabaseName(), {
      maxAge: 150,
      maxBytes: Number.POSITIVE_INFINITY,
      compactionBatchSize: 2,
    })
    const first = validSnapshot(100, 'Cash')
    const second = validSnapshot(200, 'Wallet')
    const third = validSnapshot(300, 'Current')
    await seedReplica(storage, first)
    await storage.commitCanonical({
      before: first,
      after: second,
      outbox: [],
      pushed: false,
    })
    await storage.commitCanonical({
      before: second,
      after: third,
      outbox: [],
      pushed: false,
    })

    const result = await storage.compactOneBatch()

    expect(result).toMatchObject({ entriesDeleted: 2 })
    await expect(storage.loadCurrent()).resolves.toMatchObject({ base: third })
    await expect(storage.loadHistoricalState(2)).resolves.toEqual(second)
    await expect(storage.listHistory({ limit: 10 })).resolves.toMatchObject({
      entries: [
        { sequence: 3, kind: 'transition' },
        { sequence: 2, kind: 'checkpoint', reason: 'retention' },
      ],
    })
  })

  it('keeps compacting for the byte limit until only the minimal checkpoint remains', async () => {
    const storage = createReplicaStorage(uniqueDatabaseName(), {
      maxAge: Number.POSITIVE_INFINITY,
      maxBytes: 1,
      compactionBatchSize: 2,
    })
    const first = validSnapshot(100, 'Cash')
    const second = validSnapshot(200, 'Wallet')
    const third = validSnapshot(300, 'Current')
    await seedReplica(storage, first)
    await storage.commitCanonical({
      before: first,
      after: second,
      outbox: [],
      pushed: false,
    })
    await storage.commitCanonical({
      before: second,
      after: third,
      outbox: [],
      pushed: false,
    })

    await expect(storage.compactOneBatch()).resolves.toMatchObject({
      entriesDeleted: 2,
    })
    await expect(storage.compactOneBatch()).resolves.toMatchObject({
      entriesDeleted: 2,
    })
    // The minimal replica is one checkpoint, so further passes stop rather
    // than keep folding to satisfy a byte budget they cannot reach.
    await expect(storage.compactOneBatch()).resolves.toMatchObject({
      entriesDeleted: 0,
    })
    await expect(storage.listHistory({ limit: 10 })).resolves.toMatchObject({
      entries: [{ sequence: 3, kind: 'checkpoint', reason: 'retention' }],
    })
    await expect(storage.loadCurrent()).resolves.toMatchObject({ base: third })
  })

  it('loads canonical state while reporting a structurally corrupt outbox', async () => {
    const storage = createReplicaStorage(uniqueDatabaseName())
    await seedReplica(storage, validSnapshot(100, 'Cash'))
    await storage.saveOutbox(7, [{ broken: true }] as any)

    await expect(storage.loadCurrent()).resolves.toMatchObject({
      rootUserId: 7,
      base: { serverTimestamp: 100 },
      outbox: {
        status: 'corrupt',
        reason: expect.stringContaining('outbox[0]'),
      },
    })
    await expect(storage.loadOutboxForRecovery()).resolves.toMatchObject({
      rootUserId: 7,
      outbox: {
        status: 'corrupt',
        reason: expect.stringContaining('outbox[0]'),
      },
    })

    await storage.discardOutbox()
    await expect(storage.loadCurrent()).resolves.toMatchObject({
      outbox: { status: 'ready', commands: [] },
    })
  })

  it('reports an outbox whose replay violates current-state invariants', async () => {
    const storage = createReplicaStorage(uniqueDatabaseName())
    await seedReplica(storage, validSnapshot(100, 'Cash'))
    await storage.saveOutbox(7, [
      {
        type: 'patch',
        issuedAt: 123,
        patch: { account: [{ id: 'cash', instrument: 999 }] },
      },
    ])

    await expect(storage.loadCurrent()).resolves.toMatchObject({
      base: { account: { cash: { instrument: 1 } } },
      outbox: {
        status: 'corrupt',
        reason: expect.stringContaining(
          'account[0].instrument references a missing entity'
        ),
      },
    })
  })

  it('destructively replaces the legacy v1 object store', async () => {
    const dbName = uniqueDatabaseName()
    const legacy = await openDB(dbName, 1, {
      upgrade(db) {
        db.createObjectStore('serverData')
      },
    })
    await legacy.put('serverData', { old: true }, 'transaction')
    legacy.close()

    const storage = createReplicaStorage(dbName)

    await expect(storage.loadCurrent()).resolves.toBeNull()
    await seedReplica(storage, validSnapshot(100, 'Cash'))
    await expect(storage.loadCurrent()).resolves.toMatchObject({
      rootUserId: 7,
    })
  })

  it('clears the previous account instead of mixing root users', async () => {
    const storage = createReplicaStorage(uniqueDatabaseName())
    const first = validSnapshot(100, 'Cash', 7)
    const second = validSnapshot(200, 'Other', 8)
    await seedReplica(storage, first)

    await storage.commitCanonical({
      before: first,
      after: second,
      outbox: [command(123)],
      pushed: false,
      checkpointReason: 'full-sync',
    })

    await expect(storage.loadCurrent()).resolves.toMatchObject({
      rootUserId: 8,
      outbox: { status: 'ready', commands: [] },
    })
    await expect(storage.listHistory({ limit: 10 })).resolves.toMatchObject({
      entries: [{ sequence: 1, kind: 'checkpoint' }],
    })
  })
})

function uniqueDatabaseName(): string {
  return `zerro-test-${crypto.randomUUID()}`
}

/**
 * Starts a replica exactly as the app does: the first canonical commit finds no
 * replica and lays down sequence 1. There is no separate initialization API, so
 * tests must not invent one — that would leave this path uncovered.
 */
function seedReplica(storage: ReplicaStorage, snapshot: TDataStore) {
  return storage.commitCanonical({
    before: snapshot,
    after: snapshot,
    outbox: [],
    pushed: false,
    checkpointReason: 'full-sync',
  })
}

function validSnapshot(
  serverTimestamp: number,
  cashTitle: string,
  rootUserId = 7
) {
  return makeStore({
    serverTimestamp,
    instrument: { 1: makeInstrument({ id: 1 }) },
    country: {
      1: { id: 1, title: 'United States', currency: 1, domain: null },
    },
    user: {
      [rootUserId]: makeUser({ id: rootUserId, parent: null, currency: 1 }),
    },
    account: {
      cash: makeAccount({ id: 'cash', title: cashTitle, user: rootUserId }),
      debt: makeAccount({
        id: 'debt',
        type: AccountType.Debt,
        user: rootUserId,
      }),
    },
  })
}

function command(issuedAt: number) {
  return { type: 'patch' as const, issuedAt, patch: {} }
}
