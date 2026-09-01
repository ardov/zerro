import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { TDataStore } from '@/6-shared/types'
import { idbBaseName } from '@/6-shared/config'
import {
  compactJournalEntries,
  createCheckpointEntry,
  createTransitionEntry,
  getRootUserId,
  parseCommandOutbox,
  replayOutbox,
  replayJournalEntries,
  validateDataStore,
  type TCommand,
  type TJournalEntry,
} from '@/zerro-core/replica'

const DATABASE_VERSION = 2
const REPLICAS_STORE = 'replicas'
const JOURNAL_ENTRIES_STORE = 'journalEntries'
const DEFAULT_MAX_AGE = 90 * 24 * 60 * 60 * 1000
const DEFAULT_MAX_BYTES = 100 * 1024 * 1024
const DEFAULT_COMPACTION_BATCH_SIZE = 100

export type TPersistedReplica = {
  rootUserId: number
  serverTimestamp: number
  headSequence: number
  latestCheckpointSequence: number
  oldestSequence: number
  oldestServerTimestamp: number
  retainedBytes: number
  outbox: TCommand[]
}

export type TLoadedOutbox =
  | { status: 'ready'; commands: TCommand[] }
  | { status: 'corrupt'; reason: string }

export type TLoadedReplica = {
  rootUserId: number
  base: TDataStore
  outbox: TLoadedOutbox
}

export type TRecoveryReplica = {
  rootUserId: number
  outbox: TLoadedOutbox
}

export type TCanonicalCommit = {
  before: TDataStore
  after: TDataStore
  outbox: TCommand[]
  pushed: boolean
  checkpointReason?: 'full-sync' | 'recovery'
}

export type THistoryPage = {
  entries: TJournalEntry[]
  nextBeforeSequence?: number
}

export type TCompactionResult = {
  entriesDeleted: number
  bytesBefore: number
  bytesAfter: number
}

export type TReplicaStorageOptions = {
  maxAge?: number
  maxBytes?: number
  compactionBatchSize?: number
}

interface ZerroReplicaDB extends DBSchema {
  replicas: {
    key: number
    value: TPersistedReplica
  }
  journalEntries: {
    key: [number, number]
    value: TJournalEntry
  }
}

export type ReplicaStorage = {
  loadCurrent(): Promise<TLoadedReplica | null>
  loadOutboxForRecovery(): Promise<TRecoveryReplica | null>
  commitCanonical(commit: TCanonicalCommit): Promise<void>
  saveOutbox(rootUserId: number, outbox: TCommand[]): Promise<void>
  discardOutbox(): Promise<void>
  listHistory(options: {
    limit: number
    beforeSequence?: number
  }): Promise<THistoryPage>
  loadHistoricalState(sequence: number): Promise<TDataStore>
  compactOneBatch(): Promise<TCompactionResult>
  clear(): Promise<void>
}

export function createReplicaStorage(
  databaseName: string,
  options: TReplicaStorageOptions = {}
): ReplicaStorage {
  const maxAge = options.maxAge ?? DEFAULT_MAX_AGE
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES
  const compactionBatchSize =
    options.compactionBatchSize ?? DEFAULT_COMPACTION_BATCH_SIZE
  if (maxAge < 0 || maxBytes < 0 || compactionBatchSize < 2) {
    throw new Error('Invalid replica retention options')
  }
  let database: Promise<IDBPDatabase<ZerroReplicaDB>> | undefined
  const getDatabase = () =>
    (database ??= openDB<ZerroReplicaDB>(databaseName, DATABASE_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 2) {
          Array.from(db.objectStoreNames).forEach(storeName => {
            db.deleteObjectStore(storeName)
          })
          db.createObjectStore(REPLICAS_STORE, { keyPath: 'rootUserId' })
          db.createObjectStore(JOURNAL_ENTRIES_STORE, {
            keyPath: ['rootUserId', 'sequence'],
          })
        }
      },
    }))

  return {
    async loadCurrent() {
      return measureStorageOperation('loadCurrent', async metrics => {
        const db = await getDatabase()
        const replica = await getSoleReplica(db)
        if (!replica) return null

        const checkpoint = await db.get(JOURNAL_ENTRIES_STORE, [
          replica.rootUserId,
          replica.latestCheckpointSequence,
        ])
        if (!checkpoint || checkpoint.kind !== 'checkpoint') {
          throw new Error('Replica checkpoint is missing')
        }
        const entries: TJournalEntry[] = [checkpoint]
        if (replica.latestCheckpointSequence < replica.headSequence) {
          const suffix = await db.getAll(
            JOURNAL_ENTRIES_STORE,
            IDBKeyRange.bound(
              [replica.rootUserId, replica.latestCheckpointSequence],
              [replica.rootUserId, replica.headSequence],
              true
            )
          )
          entries.push(...suffix)
        }
        assertContiguousSequences(
          entries,
          replica.latestCheckpointSequence,
          replica.headSequence
        )
        metrics.entriesRead = entries.length
        metrics.bytesRead = sumEntryBytes(entries)
        const replayed = replayJournalEntries(entries)
        // The manifest cursor, not the last entry, is the accepted position:
        // a cursor-only pull advances it without writing an entry to replay.
        const base = { ...replayed, serverTimestamp: replica.serverTimestamp }
        assertValid(base)

        return {
          rootUserId: replica.rootUserId,
          base,
          outbox: parseLoadedOutbox(base, replica.outbox),
        }
      })
    },

    async loadOutboxForRecovery() {
      const replica = await getSoleReplica(await getDatabase())
      return replica
        ? {
            rootUserId: replica.rootUserId,
            outbox: parsePersistedOutbox(replica.outbox),
          }
        : null
    },

    async commitCanonical(commit) {
      const rootUserId = requireRootUserId(commit.after)
      const db = await getDatabase()
      const tx = db.transaction(
        [REPLICAS_STORE, JOURNAL_ENTRIES_STORE],
        'readwrite'
      )
      const replicaStore = tx.objectStore(REPLICAS_STORE)
      const entryStore = tx.objectStore(JOURNAL_ENTRIES_STORE)
      // Deliberately not `soleReplica`: no replica at all and a replica owned
      // by someone else are both "start this account's journal from scratch",
      // which is a reset rather than the corruption that helper reports.
      const replicas = await replicaStore.getAll()
      if (replicas.length !== 1 || replicas[0].rootUserId !== rootUserId) {
        await Promise.all([replicaStore.clear(), entryStore.clear()])
        const checkpoint = createCheckpointEntry(
          rootUserId,
          1,
          commit.checkpointReason ?? 'recovery',
          commit.after
        )
        replicaStore.put({
          rootUserId,
          serverTimestamp: commit.after.serverTimestamp,
          headSequence: 1,
          latestCheckpointSequence: 1,
          oldestSequence: 1,
          oldestServerTimestamp: commit.after.serverTimestamp,
          retainedBytes: checkpoint.byteSize,
          outbox: [],
        })
        entryStore.put(checkpoint)
        await tx.done
        return
      }

      const replica = replicas[0]
      const nextSequence = replica.headSequence + 1
      // A cursor-only pull produces no entry: it advances the cursor alone.
      const entry = commit.checkpointReason
        ? createCheckpointEntry(
            rootUserId,
            nextSequence,
            commit.checkpointReason,
            commit.after
          )
        : createTransitionEntry(
            rootUserId,
            nextSequence,
            commit.before,
            commit.after,
            commit.pushed
          )
      if (entry) entryStore.put(entry)
      replicaStore.put({
        ...replica,
        serverTimestamp: commit.after.serverTimestamp,
        headSequence: entry ? nextSequence : replica.headSequence,
        latestCheckpointSequence:
          entry?.kind === 'checkpoint'
            ? entry.sequence
            : replica.latestCheckpointSequence,
        retainedBytes: replica.retainedBytes + (entry?.byteSize ?? 0),
        outbox: [...commit.outbox],
      })
      await tx.done
    },

    async saveOutbox(rootUserId, outbox) {
      const db = await getDatabase()
      const tx = db.transaction(REPLICAS_STORE, 'readwrite')
      const store = tx.objectStore(REPLICAS_STORE)
      const replica = await store.get(rootUserId)
      if (!replica) throw new Error('Replica is missing')
      store.put({ ...replica, outbox: [...outbox] })
      await tx.done
    },

    async discardOutbox() {
      const db = await getDatabase()
      const tx = db.transaction(REPLICAS_STORE, 'readwrite')
      const store = tx.objectStore(REPLICAS_STORE)
      const replica = soleReplica(await store.getAll())
      if (replica) store.put({ ...replica, outbox: [] })
      await tx.done
    },

    async listHistory({ limit, beforeSequence }) {
      if (limit < 1) return { entries: [] }
      const db = await getDatabase()
      const replica = await getSoleReplica(db)
      if (!replica) return { entries: [] }
      const entries: TJournalEntry[] = []
      const upperSequence = beforeSequence ?? replica.headSequence + 1
      let cursor = await db
        .transaction(JOURNAL_ENTRIES_STORE)
        .store.openCursor(
          IDBKeyRange.bound(
            [replica.rootUserId, replica.oldestSequence],
            [replica.rootUserId, upperSequence],
            false,
            true
          ),
          'prev'
        )
      while (cursor && entries.length < limit) {
        entries.push(cursor.value)
        cursor = await cursor.continue()
      }
      const last = entries.at(-1)
      return {
        entries,
        ...(last && last.sequence > replica.oldestSequence
          ? { nextBeforeSequence: last.sequence }
          : {}),
      }
    },

    async loadHistoricalState(sequence) {
      return measureStorageOperation('loadHistoricalState', async metrics => {
        const db = await getDatabase()
        const replica = await getSoleReplica(db)
        if (!replica) throw new Error('Replica is missing')
        if (
          sequence < replica.oldestSequence ||
          sequence > replica.headSequence
        ) {
          throw new Error('History sequence is outside the retained range')
        }
        const descending: TJournalEntry[] = []
        let cursor = await db
          .transaction(JOURNAL_ENTRIES_STORE)
          .store.openCursor(
            IDBKeyRange.bound(
              [replica.rootUserId, replica.oldestSequence],
              [replica.rootUserId, sequence]
            ),
            'prev'
          )
        while (cursor) {
          descending.push(cursor.value)
          if (cursor.value.kind === 'checkpoint') break
          cursor = await cursor.continue()
        }
        if (descending.at(-1)?.kind !== 'checkpoint') {
          throw new Error('Historical checkpoint is missing')
        }
        const entries = descending.reverse()
        metrics.entriesRead = entries.length
        metrics.bytesRead = sumEntryBytes(entries)
        const state = replayJournalEntries(entries)
        assertValid(state)
        return state
      })
    },

    async compactOneBatch() {
      return measureStorageOperation('compactOneBatch', async metrics => {
        const db = await getDatabase()
        const tx = db.transaction(
          [REPLICAS_STORE, JOURNAL_ENTRIES_STORE],
          'readwrite'
        )
        const replicaStore = tx.objectStore(REPLICAS_STORE)
        const entryStore = tx.objectStore(JOURNAL_ENTRIES_STORE)
        // The outcome is both the return value and the interesting half of the
        // metrics, so every exit reports through here.
        const report = (result: TCompactionResult) => {
          Object.assign(metrics, result)
          return result
        }
        const replica = soleReplica(await replicaStore.getAll())
        if (!replica || !shouldCompact(replica, maxAge, maxBytes)) {
          await tx.done
          const retained = replica?.retainedBytes ?? 0
          return report({
            entriesDeleted: 0,
            bytesBefore: retained,
            bytesAfter: retained,
          })
        }

        const entries = await entryStore.getAll(
          IDBKeyRange.bound(
            [replica.rootUserId, replica.oldestSequence],
            [replica.rootUserId, replica.headSequence]
          ),
          compactionBatchSize
        )
        metrics.entriesRead = entries.length
        metrics.bytesRead = sumEntryBytes(entries)
        if (entries.length < 2 || entries[0].kind !== 'checkpoint') {
          throw new Error('Compaction prefix must start with a checkpoint')
        }

        const checkpoint = compactJournalEntries(entries)
        entries.forEach(entry =>
          entryStore.delete([entry.rootUserId, entry.sequence])
        )
        entryStore.put(checkpoint)
        const retainedBytes =
          replica.retainedBytes - sumEntryBytes(entries) + checkpoint.byteSize
        const nextReplica: TPersistedReplica = {
          ...replica,
          oldestSequence: checkpoint.sequence,
          oldestServerTimestamp: checkpoint.serverTimestamp,
          latestCheckpointSequence: Math.max(
            replica.latestCheckpointSequence,
            checkpoint.sequence
          ),
          retainedBytes,
        }
        replicaStore.put(nextReplica)
        await tx.done
        return report({
          entriesDeleted: entries.length,
          bytesBefore: replica.retainedBytes,
          bytesAfter: retainedBytes,
        })
      })
    },

    async clear() {
      const tx = (await getDatabase()).transaction(
        [REPLICAS_STORE, JOURNAL_ENTRIES_STORE],
        'readwrite'
      )
      tx.objectStore(REPLICAS_STORE).clear()
      tx.objectStore(JOURNAL_ENTRIES_STORE).clear()
      await tx.done
    },
  }
}

export const replicaStorage = createReplicaStorage(idbBaseName)

/**
 * A single checkpoint plus the outbox is the minimum durable replica, so a
 * journal with nothing older than its head is never compacted even when it is
 * over budget.
 */
function shouldCompact(
  replica: TPersistedReplica,
  maxAge: number,
  maxBytes: number
): boolean {
  if (replica.oldestSequence >= replica.headSequence) return false
  return (
    replica.oldestServerTimestamp < replica.serverTimestamp - maxAge ||
    replica.retainedBytes > maxBytes
  )
}

/**
 * Today's runtime keeps exactly one replica and clears the store when the root
 * user changes, so more than one row means the invariant is already broken and
 * nothing here can tell which row is live.
 */
function soleReplica(
  replicas: readonly TPersistedReplica[]
): TPersistedReplica | null {
  if (replicas.length > 1) {
    throw new Error('Replica storage must contain exactly one replica')
  }
  return replicas[0] ?? null
}

async function getSoleReplica(
  db: IDBPDatabase<ZerroReplicaDB>
): Promise<TPersistedReplica | null> {
  return soleReplica(await db.getAll(REPLICAS_STORE))
}

function assertValid(state: TDataStore): void {
  const validation = validateDataStore(state)
  if (!validation.ok) throw new Error(validation.reason)
}

function parseLoadedOutbox(
  base: TDataStore,
  value: unknown
): TLoadedReplica['outbox'] {
  const parsed = parsePersistedOutbox(value)
  if (parsed.status === 'corrupt') return parsed
  try {
    assertValid(replayOutbox(base, parsed.commands))
    return parsed
  } catch (error) {
    return {
      status: 'corrupt',
      reason: error instanceof Error ? error.message : String(error),
    }
  }
}

function parsePersistedOutbox(value: unknown): TLoadedOutbox {
  try {
    return { status: 'ready', commands: parseCommandOutbox(value) }
  } catch (error) {
    return {
      status: 'corrupt',
      reason: error instanceof Error ? error.message : String(error),
    }
  }
}

function sumEntryBytes(entries: readonly TJournalEntry[]): number {
  return entries.reduce((total, entry) => total + entry.byteSize, 0)
}

function assertContiguousSequences(
  entries: readonly TJournalEntry[],
  firstSequence: number,
  lastSequence: number
): void {
  const expectedLength = lastSequence - firstSequence + 1
  if (
    entries.length !== expectedLength ||
    entries.some((entry, index) => entry.sequence !== firstSequence + index)
  ) {
    throw new Error('Replica journal sequence is missing')
  }
}

type TStorageMetrics = {
  duration: number
  entriesRead: number
  bytesRead: number
  entriesDeleted?: number
  bytesBefore?: number
  bytesAfter?: number
}

async function measureStorageOperation<T>(
  name: 'loadCurrent' | 'loadHistoricalState' | 'compactOneBatch',
  operation: (metrics: TStorageMetrics) => Promise<T>
): Promise<T> {
  const startedAt = performance.now()
  const metrics: TStorageMetrics = {
    duration: 0,
    entriesRead: 0,
    bytesRead: 0,
  }
  try {
    return await operation(metrics)
  } finally {
    metrics.duration = performance.now() - startedAt
    const debugWindow = globalThis as typeof globalThis & {
      zerro?: { logs?: Record<string, unknown[]> }
    }
    if (debugWindow.zerro) {
      debugWindow.zerro.logs ??= {}
      ;(debugWindow.zerro.logs[name] ??= []).push(metrics)
    }
  }
}

/**
 * The replica is keyed by its owner, so a snapshot without one cannot be
 * stored. Redux resolves the owner with the same domain helper and skips the
 * write when it finds none, which makes this a guard rather than a live path.
 */
function requireRootUserId(snapshot: TDataStore): number {
  const rootUserId = getRootUserId(snapshot.user)
  if (rootUserId === null) throw new Error('Snapshot has no root user')
  return rootUserId
}
