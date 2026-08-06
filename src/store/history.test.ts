import { describe, expect, it } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import {
  appendCanonicalJournalPoint,
  createJournalBranch,
  journalPersistenceVersion,
  type TCommand,
} from 'zerro-core/replica'
import {
  makeAccount,
  makeInstrument,
  makeStore,
  makeUser,
} from 'zerro-core/support/testing/zenmoneyTestData'
import { AccountType } from 'zerro-core/internal/domain/zenmoney/entities/accounts'
import { makeTestRootState } from './testing'
import { rootReducer } from './rootReducer'
import {
  selectDisplayedData,
  selectHistoryHeadPoint,
  selectHistoryPointData,
  selectHistoryRows,
  selectHistoryStep,
  selectIsBrowsingHistory,
  selectIsHistoryPointVisible,
  selectSelectedHistoryEntryMissing,
  selectSelectedHistoryPoint,
  selectHistoryPoint,
  exitHistoryBrowsing,
  returnToCurrent,
  toggleHistoryRun,
} from './history'
import {
  appendClientCommand,
  restoreOutboxPosition,
  undoClientCommand,
  validateJournalPoint,
} from './data'
import { core } from 'zerro-core/redux'
import { setAccountInBalance } from 'zerro-core/runtime/redux/commands'

function makeAccountCommand(title: string, issuedAt: number): TCommand {
  return {
    type: 'patch',
    patch: { account: [makeAccount({ id: 'cash', title })] },
    issuedAt,
  }
}

describe('history view', () => {
  it('switches core read selectors between a journal point and live current state', () => {
    const checkpoint = makeStore({
      serverTimestamp: 1,
      account: { cash: makeAccount({ id: 'cash', title: 'Cash' }) },
    })
    const middle = makeStore({
      serverTimestamp: 2,
      account: { cash: makeAccount({ id: 'cash', title: 'Wallet' }) },
    })
    const current = makeStore({
      serverTimestamp: 3,
      account: { cash: makeAccount({ id: 'cash', title: 'Current' }) },
    })
    const branch = appendCanonicalJournalPoint(
      appendCanonicalJournalPoint(
        createJournalBranch('main', checkpoint),
        checkpoint,
        middle,
        'point-2',
        true
      ),
      middle,
      current,
      'point-3',
      true
    )
    const initial = makeTestRootState(current)
    initial.data.journal = {
      version: journalPersistenceVersion,
      activeBranchId: 'main',
      branches: [branch],
    }

    const selected = rootReducer(
      initial,
      selectHistoryPoint({
        kind: 'journal',
        ref: { branchId: 'main', pointId: 'point-2' },
      })
    )

    expect(selectIsHistoryPointVisible(selected)).toBe(true)
    expect(selectHistoryPointData(selected)?.account.cash.title).toBe('Wallet')
    expect(selectDisplayedData(selected)).toBe(selectHistoryPointData(selected))

    const showingCurrent = rootReducer(selected, exitHistoryBrowsing())
    expect(selectIsHistoryPointVisible(showingCurrent)).toBe(false)
    expect(selectIsBrowsingHistory(showingCurrent)).toBe(false)
    expect(selectDisplayedData(showingCurrent)).toBe(current)
  })

  it('selects a local outbox position without touching the journal', () => {
    const base = makeStore({
      serverTimestamp: 1,
      account: { cash: makeAccount({ id: 'cash', title: 'Cash' }) },
    })
    const first = makeAccountCommand('Wallet', 10)
    const second = makeAccountCommand('Vault', 20)
    let state = rootReducer(makeTestRootState(base), appendClientCommand(first))
    state = rootReducer(state, appendClientCommand(second))

    const selected = rootReducer(
      state,
      selectHistoryPoint({ kind: 'local', index: 0 })
    )

    expect(selectHistoryPointData(selected)?.account.cash.title).toBe('Wallet')
    expect(selectDisplayedData(selected)?.account.cash.title).toBe('Wallet')
    // Live current is unaffected by merely viewing an earlier local position.
    expect(selected.data.current.account.cash.title).toBe('Vault')
  })

  it('reports a stale selection instead of silently falling back to current', () => {
    const base = makeStore({ serverTimestamp: 1 })
    const state = rootReducer(
      makeTestRootState(base),
      selectHistoryPoint({ kind: 'local', index: 0 })
    )

    // Index 0 does not exist: the outbox is empty.
    expect(selectSelectedHistoryEntryMissing(state)).toBe(true)
    expect(selectIsHistoryPointVisible(state)).toBe(false)
    // The app body still has something to show.
    expect(selectDisplayedData(state)).toBe(state.data.current)
  })

  it('lazily records the validator result for a selected server point', () => {
    const checkpoint = makeStore({ serverTimestamp: 1 })
    const next = makeStore({
      serverTimestamp: 2,
      account: { cash: makeAccount({ id: 'cash' }) },
    })
    const branch = appendCanonicalJournalPoint(
      createJournalBranch('main', checkpoint),
      checkpoint,
      next,
      'point-2',
      true
    )
    const initial = makeTestRootState(next)
    initial.data.journal = {
      version: journalPersistenceVersion,
      activeBranchId: 'main',
      branches: [branch],
    }

    const validated = rootReducer(
      initial,
      validateJournalPoint({ branchId: 'main', pointId: 'point-2' })
    )

    expect(validated.data.journal?.branches[0].points[0].validation).toEqual({
      kind: 'valid',
      validatorVersion: 1,
    })
  })

  it('validates a checkpoint the same lazy way as a point', () => {
    const checkpoint = makeStore({ serverTimestamp: 1 })
    const initial = makeTestRootState(checkpoint)
    initial.data.journal = {
      version: journalPersistenceVersion,
      activeBranchId: 'main',
      branches: [createJournalBranch('main', checkpoint)],
    }

    const validated = rootReducer(
      initial,
      validateJournalPoint({ branchId: 'main', pointId: null })
    )

    expect(validated.data.journal?.branches[0].checkpointValidation).toEqual({
      kind: 'valid',
      validatorVersion: 1,
    })
  })

  it('keeps ordinary commands read-only and restores explicitly from history', () => {
    const makeSnapshot = (serverTimestamp: number, title: string) =>
      makeStore({
        serverTimestamp,
        instrument: { 1: makeInstrument({ id: 1 }) },
        user: { 1: makeUser({ id: 1, parent: null, currency: 1 }) },
        account: {
          debt: makeAccount({ id: 'debt', type: AccountType.Debt }),
          cash: makeAccount({ id: 'cash', title }),
        },
      })
    const checkpoint = makeSnapshot(1, 'Cash')
    const selected = makeSnapshot(2, 'Wallet')
    const current = makeSnapshot(3, 'Current')
    // `current` gets its own journal point: the newest point is the live
    // state, so the selected one is genuinely in the past.
    const branch = appendCanonicalJournalPoint(
      appendCanonicalJournalPoint(
        createJournalBranch('main', checkpoint),
        checkpoint,
        selected,
        'point-2',
        true
      ),
      selected,
      current,
      'point-3',
      true
    )
    const state = makeTestRootState(current)
    state.data.journal = {
      version: journalPersistenceVersion,
      activeBranchId: 'main',
      branches: [branch],
    }
    const store = configureStore({
      reducer: rootReducer,
      preloadedState: state,
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
          immutableCheck: false,
          serializableCheck: false,
        }),
    })

    store.dispatch(
      selectHistoryPoint({
        kind: 'journal',
        ref: { branchId: 'main', pointId: 'point-2' },
      })
    )
    store.dispatch(setAccountInBalance('cash', true))
    expect(store.getState().data.outbox).toHaveLength(0)

    expect(store.dispatch(core.restore.apply(selected))).toBe(true)
    expect(store.getState().data.outbox).toHaveLength(1)
    expect(store.getState().data.current.account.cash.title).toBe('Wallet')
  })

  it('restores a local point by undoing to it, not by diffing and appending', () => {
    const base = makeStore({
      serverTimestamp: 1,
      account: { cash: makeAccount({ id: 'cash', title: 'Cash' }) },
    })
    let state = rootReducer(
      makeTestRootState(base),
      appendClientCommand(makeAccountCommand('Wallet', 10))
    )
    state = rootReducer(
      state,
      appendClientCommand(makeAccountCommand('Vault', 20))
    )

    const restored = rootReducer(state, restoreOutboxPosition(0))

    expect(restored.data.outbox).toHaveLength(1)
    expect(restored.data.redo).toHaveLength(1)
    expect(restored.data.current.account.cash.title).toBe('Wallet')
  })

  it('orders rows redo-first, then local commands newest first, then journal newest first', () => {
    const checkpoint = makeStore({ serverTimestamp: 1 })
    const point = makeStore({
      serverTimestamp: 2,
      account: { cash: makeAccount({ id: 'cash', title: 'Wallet' }) },
    })
    const branch = appendCanonicalJournalPoint(
      createJournalBranch('main', checkpoint),
      checkpoint,
      point,
      'point-2',
      true
    )
    let state = makeTestRootState(point)
    state.data.journal = {
      version: journalPersistenceVersion,
      activeBranchId: 'main',
      branches: [branch],
    }
    state = rootReducer(
      state,
      appendClientCommand(makeAccountCommand('Vault', 20))
    )
    state = rootReducer(state, undoClientCommand())

    const rows = selectHistoryRows(state)

    expect(rows.map(row => row.type)).toEqual([
      'redo',
      'divider',
      'journal',
      'journal',
    ])
  })

  it('collapses a run of consecutive unpushed points and lets it be expanded', () => {
    const withCash = (serverTimestamp: number, title: string) =>
      makeStore({
        serverTimestamp,
        account: { cash: makeAccount({ id: 'cash', title }) },
      })
    const checkpoint = withCash(1, 'Cash')
    const a = withCash(2, 'A')
    const b = withCash(3, 'B')
    const c = withCash(4, 'C')
    const branch = appendCanonicalJournalPoint(
      appendCanonicalJournalPoint(
        appendCanonicalJournalPoint(
          createJournalBranch('main', checkpoint),
          checkpoint,
          a,
          'p-a',
          false
        ),
        a,
        b,
        'p-b',
        false
      ),
      b,
      c,
      'p-c',
      false
    )
    const state = makeTestRootState(c)
    state.data.journal = {
      version: journalPersistenceVersion,
      activeBranchId: 'main',
      branches: [branch],
    }

    const collapsed = selectHistoryRows(state)
    expect(collapsed.map(row => row.type)).toEqual(['run', 'journal'])
    expect(collapsed[0]).toMatchObject({
      type: 'run',
      entries: [
        { ref: { pointId: 'p-c' } },
        { ref: { pointId: 'p-b' } },
        { ref: { pointId: 'p-a' } },
      ],
    })
  })

  it('steps back and forward across the local/journal boundary', () => {
    const checkpoint = makeStore({ serverTimestamp: 1 })
    const point = makeStore({
      serverTimestamp: 2,
      account: { cash: makeAccount({ id: 'cash', title: 'Cash' }) },
    })
    const branch = appendCanonicalJournalPoint(
      createJournalBranch('main', checkpoint),
      checkpoint,
      point,
      'point-2',
      true
    )
    let state = makeTestRootState(point)
    state.data.journal = {
      version: journalPersistenceVersion,
      activeBranchId: 'main',
      branches: [branch],
    }
    state = rootReducer(
      state,
      appendClientCommand(makeAccountCommand('Wallet', 10))
    )
    state = rootReducer(
      state,
      appendClientCommand(makeAccountCommand('Vault', 20))
    )

    const selected = rootReducer(
      state,
      selectHistoryPoint({ kind: 'local', index: 0 })
    )
    const step = selectHistoryStep(selected)

    expect(step.back).toEqual({
      kind: 'journal',
      ref: { branchId: 'main', pointId: 'point-2' },
    })
    expect(step.forward).toEqual({ kind: 'local', index: 1 })
  })

  it('treats the newest row as live data rather than as a point in the past', () => {
    const base = makeStore({
      serverTimestamp: 1,
      account: { cash: makeAccount({ id: 'cash', title: 'Cash' }) },
    })
    let state = rootReducer(
      makeTestRootState(base),
      appendClientCommand(makeAccountCommand('Wallet', 10))
    )
    state = rootReducer(state, selectHistoryPoint({ kind: 'local', index: 0 }))

    // The head is the live replica under another name: browsing it must not
    // freeze the app, and the forward arrow has nowhere to go.
    expect(selectIsBrowsingHistory(state)).toBe(true)
    expect(selectSelectedHistoryPoint(state)).toBeNull()
    expect(selectIsHistoryPointVisible(state)).toBe(false)
    expect(selectSelectedHistoryEntryMissing(state)).toBe(false)
    expect(selectDisplayedData(state)).toBe(state.data.current)
    expect(selectHistoryStep(state).forward).toBeNull()
    expect(selectHistoryStep(state).back).toBeNull()
  })

  it('keeps the bar open after stepping forward onto the head', () => {
    const base = makeStore({
      serverTimestamp: 1,
      account: { cash: makeAccount({ id: 'cash', title: 'Cash' }) },
    })
    let state = rootReducer(
      makeTestRootState(base),
      appendClientCommand(makeAccountCommand('Wallet', 10))
    )
    state = rootReducer(
      state,
      appendClientCommand(makeAccountCommand('Vault', 20))
    )
    state = rootReducer(state, selectHistoryPoint({ kind: 'local', index: 0 }))

    const forward = selectHistoryStep(state).forward
    expect(forward).toEqual({ kind: 'local', index: 1 })
    const stepped = rootReducer(state, selectHistoryPoint(forward!))

    // Arriving at the head must not close the transport the user is pressing.
    expect(selectIsBrowsingHistory(stepped)).toBe(true)
    expect(selectSelectedHistoryPoint(stepped)).toBeNull()
    expect(selectHistoryStep(stepped).back).toEqual({ kind: 'local', index: 0 })
    expect(selectHistoryStep(stepped).forward).toBeNull()

    // Only an explicit exit closes it.
    expect(
      selectIsBrowsingHistory(rootReducer(stepped, returnToCurrent()))
    ).toBe(true)
    expect(
      selectIsBrowsingHistory(rootReducer(stepped, exitHistoryBrowsing()))
    ).toBe(false)
  })

  it('unblocks writes when an undo makes the selected point the head', () => {
    const base = makeStore({
      serverTimestamp: 1,
      account: { cash: makeAccount({ id: 'cash', title: 'Cash' }) },
    })
    let state = rootReducer(
      makeTestRootState(base),
      appendClientCommand(makeAccountCommand('Wallet', 10))
    )
    state = rootReducer(
      state,
      appendClientCommand(makeAccountCommand('Vault', 20))
    )
    state = rootReducer(state, selectHistoryPoint({ kind: 'local', index: 0 }))
    expect(selectIsHistoryPointVisible(state)).toBe(true)

    // The stored selection did not change; the list caught up with it.
    const undone = rootReducer(state, undoClientCommand())

    expect(selectHistoryHeadPoint(undone)).toEqual({ kind: 'local', index: 0 })
    expect(selectSelectedHistoryPoint(undone)).toBeNull()
    expect(selectIsHistoryPointVisible(undone)).toBe(false)
    expect(selectIsBrowsingHistory(undone)).toBe(true)
  })

  it('does not rewind to the head that a new command just displaced', () => {
    const base = makeStore({
      serverTimestamp: 1,
      account: { cash: makeAccount({ id: 'cash', title: 'Cash' }) },
    })
    let state = rootReducer(
      makeTestRootState(base),
      appendClientCommand(makeAccountCommand('Wallet', 10))
    )
    // Selecting the newest row shows live data, so writing stays possible.
    state = rootReducer(state, selectHistoryPoint({ kind: 'local', index: 0 }))
    expect(selectSelectedHistoryPoint(state)).toBeNull()

    state = rootReducer(
      state,
      appendClientCommand(makeAccountCommand('Vault', 20))
    )

    // Index 0 is no longer the head. Keeping it selected would have shown the
    // state from before the command the user just issued.
    expect(selectSelectedHistoryPoint(state)).toBeNull()
    expect(selectIsHistoryPointVisible(state)).toBe(false)
    expect(selectIsBrowsingHistory(state)).toBe(true)
    expect(selectDisplayedData(state).account.cash.title).toBe('Vault')
  })

  it('separates the local stack from the journal with a divider', () => {
    const checkpoint = makeStore({ serverTimestamp: 1 })
    const point = makeStore({
      serverTimestamp: 2,
      account: { cash: makeAccount({ id: 'cash', title: 'Cash' }) },
    })
    const branch = appendCanonicalJournalPoint(
      createJournalBranch('main', checkpoint),
      checkpoint,
      point,
      'point-2',
      true
    )
    let state = makeTestRootState(point)
    state.data.journal = {
      version: journalPersistenceVersion,
      activeBranchId: 'main',
      branches: [branch],
    }

    expect(selectHistoryRows(state).map(row => row.type)).toEqual([
      'journal',
      'journal',
    ])

    state = rootReducer(
      state,
      appendClientCommand(makeAccountCommand('Wallet', 10))
    )

    expect(selectHistoryRows(state).map(row => row.type)).toEqual([
      'local',
      'divider',
      'journal',
      'journal',
    ])
  })

  it('makes a collapsed run one step and expands it under its own header', () => {
    const withCash = (serverTimestamp: number, title: string) =>
      makeStore({
        serverTimestamp,
        account: { cash: makeAccount({ id: 'cash', title }) },
      })
    const checkpoint = withCash(1, 'Cash')
    const a = withCash(2, 'A')
    const b = withCash(3, 'B')
    const branch = appendCanonicalJournalPoint(
      appendCanonicalJournalPoint(
        createJournalBranch('main', checkpoint),
        checkpoint,
        a,
        'p-a',
        false
      ),
      a,
      b,
      'p-b',
      false
    )
    const state = makeTestRootState(b)
    state.data.journal = {
      version: journalPersistenceVersion,
      activeBranchId: 'main',
      branches: [branch],
    }

    // Collapsed, the run stands in for its newest point: one step, not none.
    expect(selectHistoryHeadPoint(state)).toEqual({
      kind: 'journal',
      ref: { branchId: 'main', pointId: 'p-b' },
    })
    const selected = rootReducer(
      state,
      selectHistoryPoint({
        kind: 'journal',
        ref: { branchId: 'main', pointId: null },
      })
    )
    expect(selectHistoryStep(selected).forward).toEqual({
      kind: 'journal',
      ref: { branchId: 'main', pointId: 'p-b' },
    })

    const runRow = selectHistoryRows(state)[0]
    if (runRow.type !== 'run') throw new Error('expected a collapsed run')
    const expanded = rootReducer(state, toggleHistoryRun(runRow.id))

    // The header stays so the expansion can be undone, and stops being a
    // position of its own once its points are rows.
    expect(selectHistoryRows(expanded).map(row => row.type)).toEqual([
      'run',
      'journal',
      'journal',
      'journal',
    ])
    expect(selectHistoryHeadPoint(expanded)).toEqual({
      kind: 'journal',
      ref: { branchId: 'main', pointId: 'p-b' },
    })
  })
})
