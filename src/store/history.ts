import {
  createSelector,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit'
import type { AppThunk } from 'store'
import type { RootState } from './rootReducer'
import { appendClientCommand, rebaseServerInbox } from './data/slice'
import {
  getMaterializedOutboxPatches,
  replayOutbox,
  summarizeCanonicalTransition,
  summarizeNormalizedPatch,
  type TChangeSummary,
  type TCommand,
  type TJournalEntry,
} from 'zerro-core/replica'
import type { TDataStore } from '6-shared/types'
import { replicaStorage } from '6-shared/api/replicaStorage'
import { waitForPersistedReplica } from './data/replicaPersistence'

export type THistoryPointRef =
  { kind: 'journal'; sequence: number } | { kind: 'local'; index: number }

export type TStoredHistoryEntry = {
  sequence: number
  kind: 'checkpoint' | 'sync'
  serverTimestamp: number
  pushed: boolean
  summary?: TChangeSummary
}

type THistorySelection =
  | { status: 'idle'; point: null }
  | {
      status: 'local'
      point: Extract<THistoryPointRef, { kind: 'local' }>
    }
  | {
      status: 'loading' | 'missing'
      point: Extract<THistoryPointRef, { kind: 'journal' }>
    }
  | {
      status: 'ready'
      point: Extract<THistoryPointRef, { kind: 'journal' }>
      snapshot: TDataStore
    }

type THistoryState = {
  browsing: boolean
  selection: THistorySelection
  entries: TStoredHistoryEntry[]
  nextBeforeSequence?: number
  pageStatus: 'idle' | 'loading' | 'ready'
  expandedRuns: string[]
}

const initialState: THistoryState = {
  browsing: false,
  selection: { status: 'idle', point: null },
  entries: [],
  pageStatus: 'idle',
  expandedRuns: [],
}

const { reducer, actions } = createSlice({
  name: 'history',
  initialState,
  reducers: {
    setHistoryPoint: (state, action: PayloadAction<THistoryPointRef>) => {
      state.browsing = true
      state.selection =
        action.payload.kind === 'journal'
          ? { status: 'loading', point: action.payload }
          : { status: 'local', point: action.payload }
    },
    historicalStateLoaded: (
      state,
      action: PayloadAction<{ sequence: number; snapshot: TDataStore }>
    ) => {
      if (
        state.selection.point?.kind !== 'journal' ||
        state.selection.point.sequence !== action.payload.sequence
      )
        return
      state.selection = {
        status: 'ready',
        point: state.selection.point,
        snapshot: action.payload.snapshot,
      }
    },
    historicalStateMissing: (state, action: PayloadAction<number>) => {
      if (
        state.selection.point?.kind !== 'journal' ||
        state.selection.point.sequence !== action.payload
      )
        return
      state.selection = { status: 'missing', point: state.selection.point }
    },
    historyPageLoading: state => {
      state.pageStatus = 'loading'
    },
    historyPageFailed: state => {
      state.pageStatus = 'ready'
    },
    historyPageLoaded: (
      state,
      action: PayloadAction<{
        entries: TStoredHistoryEntry[]
        nextBeforeSequence?: number
        replace: boolean
      }>
    ) => {
      const entries = action.payload.replace
        ? action.payload.entries
        : [...state.entries, ...action.payload.entries]
      state.entries = Array.from(
        new Map(entries.map(entry => [entry.sequence, entry])).values()
      ).sort((a, b) => b.sequence - a.sequence)
      state.nextBeforeSequence = action.payload.nextBeforeSequence
      state.pageStatus = 'ready'
    },
    returnToCurrent: state => {
      state.selection = { status: 'idle', point: null }
    },
    exitHistoryBrowsing: state => {
      state.browsing = false
      state.selection = { status: 'idle', point: null }
    },
    toggleHistoryRun: (state, action: PayloadAction<string>) => {
      const index = state.expandedRuns.indexOf(action.payload)
      if (index === -1) state.expandedRuns.push(action.payload)
      else state.expandedRuns.splice(index, 1)
    },
  },
  extraReducers: builder => {
    builder.addCase(appendClientCommand, state => {
      state.selection = { status: 'idle', point: null }
    })
    builder.addCase(rebaseServerInbox, state => {
      state.entries = []
      state.nextBeforeSequence = undefined
      state.pageStatus = 'idle'
    })
  },
})

export default reducer

const {
  setHistoryPoint,
  historicalStateLoaded,
  historicalStateMissing,
  historyPageLoading,
  historyPageLoaded,
  historyPageFailed,
} = actions

export const { returnToCurrent, exitHistoryBrowsing, toggleHistoryRun } =
  actions

export const selectHistoryPoint =
  (point: THistoryPointRef): AppThunk<Promise<void>> =>
  async dispatch => {
    dispatch(setHistoryPoint(point))
    if (point.kind !== 'journal') return
    await loadJournalPoint(dispatch, point.sequence)
  }

/** Revalidates the active journal selection after a canonical write and its
 * retention pass. Local selections are derived from Redux and need no read. */
export const refreshSelectedHistoryPoint =
  (): AppThunk<Promise<void>> => async (dispatch, getState) => {
    const point = getState().history.selection.point
    if (point?.kind !== 'journal') return
    await loadJournalPoint(dispatch, point.sequence)
  }

async function loadJournalPoint(
  dispatch: (
    action:
      | ReturnType<typeof historicalStateLoaded>
      | ReturnType<typeof historicalStateMissing>
  ) => unknown,
  sequence: number
): Promise<void> {
  await waitForPersistedReplica()
  try {
    const snapshot = await replicaStorage.loadHistoricalState(sequence)
    dispatch(historicalStateLoaded({ sequence, snapshot }))
  } catch (error) {
    console.warn('Failed to load historical state', error)
    dispatch(historicalStateMissing(sequence))
  }
}

export const loadHistoryPage =
  ({ replace = false }: { replace?: boolean } = {}): AppThunk<Promise<void>> =>
  async (dispatch, getState) => {
    const history = getState().history
    if (history.pageStatus === 'loading') return
    dispatch(historyPageLoading())
    try {
      // Same read barrier the selection uses. A canonical commit clears this
      // page synchronously and the panel reloads it immediately, so without
      // the wait the list would race the write that produced the new entry
      // and settle without it.
      await waitForPersistedReplica()
      const page = await replicaStorage.listHistory({
        limit: 100,
        ...(replace || history.nextBeforeSequence === undefined
          ? {}
          : { beforeSequence: history.nextBeforeSequence }),
      })
      dispatch(
        historyPageLoaded({
          entries: page.entries.map(toStoredHistoryEntry),
          nextBeforeSequence: page.nextBeforeSequence,
          replace,
        })
      )
    } catch (error) {
      console.warn('Failed to load replica history', error)
      dispatch(historyPageFailed())
    }
  }

function toStoredHistoryEntry(entry: TJournalEntry): TStoredHistoryEntry {
  return {
    sequence: entry.sequence,
    kind: entry.kind === 'checkpoint' ? 'checkpoint' : 'sync',
    serverTimestamp: entry.serverTimestamp,
    pushed: entry.kind === 'checkpoint' ? true : entry.pushed,
    ...(entry.kind === 'transition'
      ? { summary: summarizeCanonicalTransition(entry.transition) }
      : {}),
  }
}

const selectHistory = (state: RootState) => state.history
const selectBase = (state: RootState) => state.data.base
const selectOutbox = (state: RootState) => state.data.outbox
const selectRedo = (state: RootState) => state.data.redo

export const selectIsBrowsingHistory = (state: RootState) =>
  selectHistory(state).browsing
const selectStoredHistoryPoint = (state: RootState) =>
  selectHistory(state).selection.point
const selectExpandedRuns = (state: RootState) =>
  selectHistory(state).expandedRuns
export const selectHistoryEntries = (state: RootState) =>
  selectHistory(state).entries
export const selectCanLoadOlderHistory = (state: RootState) =>
  selectHistory(state).nextBeforeSequence !== undefined
export const selectHistoryPageStatus = (state: RootState) =>
  selectHistory(state).pageStatus

export type THistoryRow =
  | { type: 'redo'; command: TCommand }
  | {
      type: 'local'
      command: TCommand
      point: Extract<THistoryPointRef, { kind: 'local' }>
      summary: TChangeSummary
    }
  | {
      type: 'journal'
      entry: TStoredHistoryEntry
      point: Extract<THistoryPointRef, { kind: 'journal' }>
      nested?: boolean
    }
  | {
      type: 'run'
      id: string
      entries: TStoredHistoryEntry[]
      expanded: boolean
    }
  | { type: 'divider' }

export const selectLiveHistoryRows = createSelector(
  [selectRedo, selectOutbox, selectBase],
  (redo, outbox, base): THistoryRow[] => {
    const redoRows: THistoryRow[] = redo.map(command => ({
      type: 'redo',
      command,
    }))
    const patches = getMaterializedOutboxPatches(base, outbox)
    const localRows: THistoryRow[] = outbox
      .map((command, index): THistoryRow => ({
        type: 'local',
        command,
        point: { kind: 'local', index },
        summary: summarizeNormalizedPatch(patches[index] ?? {}),
      }))
      .reverse()
    return [...redoRows, ...localRows]
  }
)

export const selectHistoryRows = createSelector(
  [selectLiveHistoryRows, selectHistoryEntries, selectExpandedRuns],
  (liveRows, entries, expandedRuns): THistoryRow[] => {
    const journalRows = groupJournalRows(entries, new Set(expandedRuns))
    const divider: THistoryRow[] =
      liveRows.length && journalRows.length ? [{ type: 'divider' }] : []
    return [...liveRows, ...divider, ...journalRows]
  }
)

export function historyRowPoint(row: THistoryRow): THistoryPointRef | null {
  if (row.type === 'local' || row.type === 'journal') return row.point
  if (row.type === 'run' && !row.expanded)
    return { kind: 'journal', sequence: row.entries[0].sequence }
  return null
}

const selectSelectablePoints = createSelector(
  [selectHistoryRows],
  (rows): THistoryPointRef[] =>
    rows
      .map(historyRowPoint)
      .filter((point): point is THistoryPointRef => point !== null)
)

const selectHistoryHeadPoint = createSelector(
  [selectSelectablePoints],
  points => points[0] ?? null
)

export const selectSelectedHistoryPoint = createSelector(
  [selectStoredHistoryPoint, selectHistoryHeadPoint],
  (point, head): THistoryPointRef | null =>
    point && head && sameHistoryPoint(point, head) ? null : point
)

export const selectHighlightedHistoryPoint = createSelector(
  [selectIsBrowsingHistory, selectSelectedHistoryPoint, selectHistoryHeadPoint],
  (browsing, selected, head) => selected ?? (browsing ? head : null)
)

export const selectHistoryPointData = createSelector(
  [selectHistory, selectBase, selectOutbox, selectSelectedHistoryPoint],
  (history, base, outbox, point): TDataStore | undefined => {
    if (!point) return undefined
    if (point.kind === 'local') {
      if (point.index < 0 || point.index >= outbox.length) return undefined
      return replayOutbox(base, outbox.slice(0, point.index + 1))
    }
    return history.selection.status === 'ready'
      ? history.selection.snapshot
      : undefined
  }
)

export const selectDisplayedData = createSelector(
  [(state: RootState) => state.data.current, selectHistoryPointData],
  (current, point) => point ?? current
)

export const selectIsHistoryPointVisible = (state: RootState) =>
  selectSelectedHistoryPoint(state) !== null &&
  selectHistoryPointData(state) !== undefined

const selectSelectedHistoryEntry = createSelector(
  [selectHistoryEntries, selectSelectedHistoryPoint],
  (entries, point) =>
    point?.kind === 'journal'
      ? entries.find(entry => entry.sequence === point.sequence)
      : undefined
)

export const selectSelectedHistoryTime = createSelector(
  [selectSelectedHistoryPoint, selectOutbox, selectSelectedHistoryEntry],
  (point, outbox, entry): number | undefined => {
    if (!point) return undefined
    return point.kind === 'local'
      ? outbox[point.index]?.issuedAt
      : entry?.serverTimestamp
  }
)

export const selectSelectedHistoryEntryMissing = (state: RootState) => {
  const point = selectSelectedHistoryPoint(state)
  if (!point) return false
  if (point.kind === 'journal') {
    return selectHistory(state).selection.status === 'missing'
  }
  return selectHistoryPointData(state) === undefined
}

export const selectHistoryStep = createSelector(
  [selectSelectablePoints, selectSelectedHistoryPoint],
  (points, selected) => {
    const index = selected
      ? points.findIndex(point => sameHistoryPoint(point, selected))
      : 0
    if (index === -1) return { back: null, forward: null }
    return {
      back: points[index + 1] ?? null,
      forward: index === 0 ? null : (points[index - 1] ?? null),
    }
  }
)

export function sameHistoryPoint(
  a: THistoryPointRef,
  b: THistoryPointRef
): boolean {
  if (a.kind === 'local' && b.kind === 'local') return a.index === b.index
  if (a.kind === 'journal' && b.kind === 'journal')
    return a.sequence === b.sequence
  return false
}

function groupJournalRows(
  entries: TStoredHistoryEntry[],
  expandedRuns: ReadonlySet<string>
): THistoryRow[] {
  const rows: THistoryRow[] = []
  let run: TStoredHistoryEntry[] = []
  const flushRun = () => {
    if (!run.length) return
    if (run.length === 1) rows.push(toJournalRow(run[0]))
    else {
      const id = `server:${run[0].sequence}`
      const expanded = expandedRuns.has(id)
      rows.push({ type: 'run', id, entries: run, expanded })
      if (expanded) run.forEach(entry => rows.push(toJournalRow(entry, true)))
    }
    run = []
  }
  entries.forEach(entry => {
    if (entry.kind === 'sync' && !entry.pushed) {
      run.push(entry)
      return
    }
    flushRun()
    rows.push(toJournalRow(entry))
  })
  flushRun()
  return rows
}

function toJournalRow(entry: TStoredHistoryEntry, nested = false): THistoryRow {
  return {
    type: 'journal',
    entry,
    point: { kind: 'journal', sequence: entry.sequence },
    nested,
  }
}
