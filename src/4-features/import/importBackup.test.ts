import { describe, expect, it, vi } from 'vitest'
import { convertDiff, parseFullBackup } from '6-shared/api/zm-adapter'
import type { TDataStore, TNormalizedPatch } from '6-shared/types'
import type { AppDispatch, AppThunk, RootState } from 'store'
import { appendClientCommand } from 'store/data'
import { makeTestRootState } from 'store/testing'
import { applyPatch } from 'zerro-core/internal/domain/zenmoney'
import { materializeCommand } from 'zerro-core/internal/operations/materialization'
import {
  makeAccount,
  makeInstrument,
  makeStore,
  makeTransaction,
  makeUser,
} from 'zerro-core/support/testing/zenmoneyTestData'

import {
  checkBackupCompatibility,
  importBackup,
  previewBackup,
} from './importBackup'

vi.mock('6-shared/analytics', () => ({ track: () => {} }))

const rootUser = makeUser({ id: 1, parent: null, currency: 2 })
const backupCollectionKeys = [
  'instrument',
  'country',
  'company',
  'user',
  'merchant',
  'account',
  'tag',
  'budget',
  'reminder',
  'reminderMarker',
  'transaction',
]

function makeSnapshot(patch: Partial<TDataStore> = {}): TDataStore {
  return makeStore({
    instrument: {
      1: makeInstrument({ id: 1 }),
      2: makeInstrument({ id: 2 }),
    },
    country: {
      1: { id: 1, title: 'United States', currency: 1, domain: 'us' },
    },
    user: { 1: rootUser },
    ...patch,
  })
}

/** The same file `exportJSON` writes: a full store as a ZenMoney diff. */
function toBackupFile(store: TDataStore): string {
  const patch: TNormalizedPatch = { serverTimestamp: store.serverTimestamp }
  const target = patch as Record<string, unknown>
  Object.entries(store).forEach(([key, value]) => {
    if (key === 'serverTimestamp') return
    target[key] = Object.values(value as object)
  })
  return JSON.stringify(convertDiff.toServer(patch))
}

function makeThunkRunner(initial: RootState) {
  let state = initial
  const dispatch = vi.fn((action: unknown) => {
    if (typeof action === 'function') {
      return (action as AppThunk)(
        dispatch as AppDispatch,
        () => state,
        undefined
      )
    }
    if ((action as { type?: string }).type === appendClientCommand.type) {
      const command = (action as ReturnType<typeof appendClientCommand>).payload
      state = makeTestRootState(
        applyPatch(
          state.data.current,
          materializeCommand(state.data.current, command)
        )
      )
    }
    return action
  })

  return {
    dispatch: dispatch as unknown as AppDispatch,
    commands: () =>
      dispatch.mock.calls
        .map(([action]) => action as { type?: string; payload?: unknown })
        .filter(action => action?.type === appendClientCommand.type),
    state: () => state,
  }
}

describe('parseFullBackup', () => {
  it('reads an exported backup back into the store it described', () => {
    const store = makeSnapshot({
      account: {
        acc: makeAccount({ id: 'acc', title: 'Cash', changed: 5000 }),
      },
      transaction: {
        tr: makeTransaction({
          id: 'tr',
          incomeAccount: 'acc',
          outcomeAccount: 'acc',
          outcome: 10,
          changed: 7000,
        }),
      },
    })

    const parsed = parseFullBackup(toBackupFile(store))
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.store.account.acc).toMatchObject({
      id: 'acc',
      title: 'Cash',
      changed: 5000,
    })
    expect(parsed.store.transaction.tr).toMatchObject({ id: 'tr', outcome: 10 })
  })

  it('rejects a file that is not JSON', () => {
    expect(parseFullBackup('not json at all')).toEqual({
      ok: false,
      reason: 'unreadable',
    })
  })

  it('rejects JSON that carries no entities', () => {
    expect(parseFullBackup('{"serverTimestamp":1}')).toEqual({
      ok: false,
      reason: 'notABackup',
    })
    expect(parseFullBackup('[1,2,3]')).toEqual({
      ok: false,
      reason: 'notABackup',
    })
    expect(parseFullBackup('{"account":"nope"}')).toEqual({
      ok: false,
      reason: 'notABackup',
    })
  })

  it('requires the complete exporter shape, including empty collections', () => {
    const complete = JSON.parse(toBackupFile(makeSnapshot())) as Record<
      string,
      unknown
    >

    backupCollectionKeys.forEach(key => {
      const incomplete = { ...complete }
      delete incomplete[key]
      expect(parseFullBackup(JSON.stringify(incomplete))).toEqual({
        ok: false,
        reason: 'notABackup',
      })
    })
  })

  it('rejects incremental diffs, deletions, malformed rows, and dangling references', () => {
    const complete = JSON.parse(toBackupFile(makeSnapshot())) as Record<
      string,
      unknown
    >
    const instruments = complete.instrument as unknown[]
    const invalidFiles = [
      { ...complete, deletion: [] },
      { ...complete, unsupportedCollection: [] },
      { ...complete, serverTimestamp: -1 },
      { ...complete, account: [{ id: 'only-an-id' }] },
      {
        ...complete,
        instrument: [...instruments, instruments[0]],
      },
      {
        ...complete,
        user: [
          {
            ...(complete.user as Array<Record<string, unknown>>)[0],
            currency: 999,
          },
        ],
      },
    ]

    invalidFiles.forEach(file => {
      expect(parseFullBackup(JSON.stringify(file))).toEqual({
        ok: false,
        reason: 'notABackup',
      })
    })
  })
})

describe('importBackup', () => {
  const backup = makeSnapshot({
    account: { acc: makeAccount({ id: 'acc', title: 'Cash' }) },
    transaction: {
      tr: makeTransaction({
        id: 'tr',
        incomeAccount: 'acc',
        outcomeAccount: 'acc',
        outcome: 100,
      }),
    },
  })
  const drifted = makeSnapshot({
    account: { acc: makeAccount({ id: 'acc', title: 'Wallet' }) },
    transaction: {
      tr: makeTransaction({
        id: 'tr',
        incomeAccount: 'acc',
        outcomeAccount: 'acc',
        outcome: 250,
      }),
      later: makeTransaction({
        id: 'later',
        incomeAccount: 'acc',
        outcomeAccount: 'acc',
        outcome: 7,
      }),
    },
  })

  it('previews the change without writing anything', () => {
    const runner = makeThunkRunner(makeTestRootState(drifted))

    expect(runner.dispatch(previewBackup(backup))).toEqual({
      account: { created: 0, updated: 1, removed: 0 },
      transaction: { created: 0, updated: 1, removed: 1 },
    })
    expect(runner.commands()).toEqual([])
  })

  it('applies the backup as one undoable command', () => {
    const runner = makeThunkRunner(makeTestRootState(drifted))
    expect(runner.dispatch(importBackup(backup))).toEqual({
      ok: true,
      applied: true,
    })

    expect(runner.commands()).toHaveLength(1)
    const restored = runner.state().data.current
    expect(restored.account.acc.title).toBe('Cash')
    expect(restored.transaction.tr.outcome).toBe(100)
    expect(restored.transaction.later.deleted).toBe(true)
  })

  it('writes nothing when the backup matches the current data', () => {
    const runner = makeThunkRunner(makeTestRootState(backup))
    expect(runner.dispatch(importBackup(backup))).toEqual({
      ok: true,
      applied: false,
    })
    expect(runner.commands()).toEqual([])
  })

  it('rejects a structurally valid backup from another account', () => {
    const foreign = makeSnapshot({
      user: {
        2: makeUser({ id: 2, parent: null, currency: 2 }),
      },
    })
    const runner = makeThunkRunner(makeTestRootState(drifted))

    expect(runner.dispatch(checkBackupCompatibility(foreign))).toEqual({
      ok: false,
      reason: 'incompatibleBackup',
    })
    expect(runner.dispatch(importBackup(foreign))).toEqual({
      ok: false,
      reason: 'incompatibleBackup',
    })
    expect(runner.commands()).toEqual([])
  })

  it('restores root-user currency when its instrument is available locally', () => {
    const currencyBackup = makeSnapshot({
      user: {
        1: makeUser({ id: 1, parent: null, currency: 1 }),
      },
    })
    const runner = makeThunkRunner(makeTestRootState(makeSnapshot()))

    expect(runner.dispatch(checkBackupCompatibility(currencyBackup))).toEqual({
      ok: true,
    })
    expect(runner.dispatch(importBackup(currencyBackup))).toEqual({
      ok: true,
      applied: true,
    })
    expect(runner.state().data.current.user[1].currency).toBe(1)
  })

  it('rejects a backup that needs a missing read-only instrument', () => {
    const dictionaryMismatch = makeSnapshot({
      instrument: {
        1: makeInstrument({ id: 1 }),
        2: makeInstrument({ id: 2 }),
        9: makeInstrument({ id: 9 }),
      },
      account: {
        foreignInstrument: makeAccount({
          id: 'foreignInstrument',
          instrument: 9,
        }),
      },
    })
    const runner = makeThunkRunner(makeTestRootState(makeSnapshot()))

    expect(
      runner.dispatch(checkBackupCompatibility(dictionaryMismatch))
    ).toEqual({ ok: false, reason: 'incompatibleBackup' })
  })
})
