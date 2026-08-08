import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'

const { storageMock } = vi.hoisted(() => ({
  storageMock: {
    listHistory: vi.fn(),
    loadHistoricalState: vi.fn(),
    clear: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('6-shared/api/replicaStorage', () => ({ replicaStorage: storageMock }))

import {
  makeAccount,
  makeStore,
} from 'zerro-core/support/testing/zenmoneyTestData'
import {
  createCheckpointEntry,
  createTransitionEntry,
} from 'zerro-core/replica'
import { appendClientCommand, applyServerPatch } from './data'
import {
  clearPersistedLocalData,
  resetReplicaPersistenceForTests,
} from './data/replicaPersistence'
import { rootReducer } from './rootReducer'
import { makeTestRootState } from './testing'
import {
  exitHistoryBrowsing,
  loadHistoryPage,
  selectDisplayedData,
  selectHistoryEntries,
  selectHistoryPoint,
  selectHistoryPointData,
  selectHistoryRows,
  selectHistoryStep,
  selectIsBrowsingHistory,
  selectIsHistoryPointVisible,
  selectSelectedHistoryEntryMissing,
  selectSelectedHistoryPoint,
  refreshSelectedHistoryPoint,
  toggleHistoryRun,
} from './history'

beforeEach(() => vi.clearAllMocks())
afterEach(() => resetReplicaPersistenceForTests())

describe('paged history view', () => {
  it('stores only paged metadata in Redux', async () => {
    const first = snapshot(100, 'Cash')
    const second = snapshot(200, 'Wallet')
    storageMock.listHistory.mockResolvedValue({
      entries: [
        createTransitionEntry(7, 2, first, second, true),
        createCheckpointEntry(7, 1, 'full-sync', first),
      ],
    })
    const store = makeStoreWithState(second)

    await store.dispatch(loadHistoryPage() as any)

    expect(selectHistoryEntries(store.getState())).toMatchObject([
      { sequence: 2, kind: 'sync', pushed: true },
      { sequence: 1, kind: 'checkpoint', pushed: true },
    ])
    expect(store.getState().history).not.toHaveProperty('journal')
    expect(JSON.stringify(store.getState().history)).not.toContain('snapshot')
  })

  it('waits for pending replica writes before reading a page', async () => {
    // A canonical commit clears the page and the panel reloads it at once, so
    // a page that read past the queue would settle without the entry that
    // commit just wrote. Any queued write will do to hold the barrier.
    let releaseWrite = () => {}
    storageMock.clear.mockImplementationOnce(
      () =>
        new Promise<void>(resolve => {
          releaseWrite = () => resolve()
        })
    )
    storageMock.listHistory.mockResolvedValue({ entries: [] })
    const store = makeStoreWithState(snapshot(100, 'Cash'))

    const write = clearPersistedLocalData()
    const page = store.dispatch(loadHistoryPage() as any)
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(storageMock.listHistory).not.toHaveBeenCalled()

    releaseWrite()
    await write
    await page
    expect(storageMock.listHistory).toHaveBeenCalledOnce()
  })

  it('loads only the selected journal snapshot', async () => {
    const live = snapshot(300, 'Current')
    const historical = snapshot(200, 'Wallet')
    storageMock.loadHistoricalState.mockResolvedValue(historical)
    const store = makeStoreWithState(live)

    await store.dispatch(
      selectHistoryPoint({ kind: 'journal', sequence: 2 }) as any
    )

    expect(storageMock.loadHistoricalState).toHaveBeenCalledWith(2)
    expect(selectHistoryPointData(store.getState())).toBe(historical)
    expect(selectDisplayedData(store.getState())).toBe(historical)
    expect(store.getState().data.current).toBe(live)

    store.dispatch(exitHistoryBrowsing())
    expect(selectIsBrowsingHistory(store.getState())).toBe(false)
    expect(selectDisplayedData(store.getState())).toBe(live)
  })

  it('keeps the selected journal snapshot across a canonical rebase', async () => {
    const live = snapshot(300, 'Current')
    const historical = snapshot(200, 'Wallet')
    storageMock.loadHistoricalState.mockResolvedValue(historical)
    const store = makeStoreWithState(live)

    await store.dispatch(
      selectHistoryPoint({ kind: 'journal', sequence: 2 }) as any
    )
    await store.dispatch(
      applyServerPatch({ serverTimestamp: 400, account: [] }) as any
    )

    expect(selectDisplayedData(store.getState())).toBe(historical)
    expect(selectIsBrowsingHistory(store.getState())).toBe(true)
  })

  it('marks a selected journal point unavailable after retention removes it', async () => {
    const live = snapshot(300, 'Current')
    const historical = snapshot(200, 'Wallet')
    storageMock.loadHistoricalState.mockResolvedValueOnce(historical)
    const store = makeStoreWithState(live)
    await store.dispatch(
      selectHistoryPoint({ kind: 'journal', sequence: 2 }) as any
    )
    storageMock.loadHistoricalState.mockRejectedValueOnce(
      new Error('History sequence is outside the retained range')
    )
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    await store.dispatch(refreshSelectedHistoryPoint() as any)

    expect(selectSelectedHistoryEntryMissing(store.getState())).toBe(true)
    expect(selectDisplayedData(store.getState())).toBe(
      store.getState().data.current
    )
  })

  it('replays a local outbox position without IndexedDB', async () => {
    const base = snapshot(100, 'Cash')
    const store = makeStoreWithState(base)
    store.dispatch(
      appendClientCommand({
        type: 'patch',
        issuedAt: 10,
        patch: { account: [makeAccount({ id: 'cash', title: 'Wallet' })] },
      })
    )
    store.dispatch(
      appendClientCommand({
        type: 'patch',
        issuedAt: 20,
        patch: { account: [makeAccount({ id: 'cash', title: 'Vault' })] },
      })
    )

    await store.dispatch(selectHistoryPoint({ kind: 'local', index: 0 }) as any)

    expect(selectHistoryPointData(store.getState())?.account.cash.title).toBe(
      'Wallet'
    )
    expect(storageMock.loadHistoricalState).not.toHaveBeenCalled()
  })

  it('keeps the local tail above canonical metadata', async () => {
    const first = snapshot(100, 'Cash')
    storageMock.listHistory.mockResolvedValue({
      entries: [createCheckpointEntry(7, 1, 'full-sync', first)],
    })
    const store = makeStoreWithState(first)
    store.dispatch(
      appendClientCommand({ type: 'patch', issuedAt: 10, patch: {} })
    )
    await store.dispatch(loadHistoryPage() as any)

    expect(selectHistoryRows(store.getState()).map(row => row.type)).toEqual([
      'section',
      'local',
      'section',
      'journal',
    ])
  })

  it('reports a stale local selection instead of treating live data as it', async () => {
    const live = snapshot(100, 'Cash')
    const store = makeStoreWithState(live)

    await store.dispatch(selectHistoryPoint({ kind: 'local', index: 0 }) as any)

    expect(selectSelectedHistoryEntryMissing(store.getState())).toBe(true)
    expect(selectIsHistoryPointVisible(store.getState())).toBe(false)
    expect(selectDisplayedData(store.getState())).toBe(live)
  })

  it('collapses consecutive pull transitions and expands them in place', async () => {
    const first = snapshot(100, 'Cash')
    const second = snapshot(200, 'Wallet')
    const third = snapshot(300, 'Vault')
    storageMock.listHistory.mockResolvedValue({
      entries: [
        createTransitionEntry(7, 3, second, third, false),
        createTransitionEntry(7, 2, first, second, false),
        createCheckpointEntry(7, 1, 'full-sync', first),
      ],
    })
    const store = makeStoreWithState(third)
    await store.dispatch(loadHistoryPage() as any)

    const collapsed = selectHistoryRows(store.getState())
    expect(collapsed.map(row => row.type)).toEqual([
      'section',
      'run',
      'journal',
    ])
    const run = collapsed[1]
    if (run.type !== 'run') throw new Error('expected a collapsed run')
    expect(run.entries.map(entry => entry.sequence)).toEqual([3, 2])

    store.dispatch(toggleHistoryRun(run.id))

    expect(selectHistoryRows(store.getState()).map(row => row.type)).toEqual([
      'section',
      'run',
      'journal',
      'journal',
      'journal',
    ])
  })

  it('steps across the local and canonical history boundary', async () => {
    const base = snapshot(100, 'Cash')
    storageMock.listHistory.mockResolvedValue({
      entries: [createCheckpointEntry(7, 1, 'full-sync', base)],
    })
    const store = makeStoreWithState(base)
    store.dispatch(
      appendClientCommand({
        type: 'patch',
        issuedAt: 10,
        patch: { account: [makeAccount({ id: 'cash', title: 'Wallet' })] },
      })
    )
    store.dispatch(
      appendClientCommand({
        type: 'patch',
        issuedAt: 20,
        patch: { account: [makeAccount({ id: 'cash', title: 'Vault' })] },
      })
    )
    await store.dispatch(loadHistoryPage() as any)
    await store.dispatch(selectHistoryPoint({ kind: 'local', index: 0 }) as any)

    expect(selectHistoryStep(store.getState())).toEqual({
      back: { kind: 'journal', sequence: 1 },
      forward: { kind: 'local', index: 1 },
    })
  })

  it('treats the newest row as live and does not rewind after a new command', async () => {
    const base = snapshot(100, 'Cash')
    const store = makeStoreWithState(base)
    store.dispatch(
      appendClientCommand({
        type: 'patch',
        issuedAt: 10,
        patch: { account: [makeAccount({ id: 'cash', title: 'Wallet' })] },
      })
    )
    await store.dispatch(selectHistoryPoint({ kind: 'local', index: 0 }) as any)
    expect(selectSelectedHistoryPoint(store.getState())).toBeNull()

    store.dispatch(
      appendClientCommand({
        type: 'patch',
        issuedAt: 20,
        patch: { account: [makeAccount({ id: 'cash', title: 'Vault' })] },
      })
    )

    expect(selectSelectedHistoryPoint(store.getState())).toBeNull()
    expect(selectDisplayedData(store.getState()).account.cash.title).toBe(
      'Vault'
    )
    expect(selectIsBrowsingHistory(store.getState())).toBe(true)
  })
})

function snapshot(serverTimestamp: number, title: string) {
  return makeStore({
    serverTimestamp,
    account: { cash: makeAccount({ id: 'cash', title }) },
  })
}

function makeStoreWithState(current: ReturnType<typeof snapshot>) {
  return configureStore({
    reducer: rootReducer,
    preloadedState: makeTestRootState(current),
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({ immutableCheck: false, serializableCheck: false }),
  })
}
