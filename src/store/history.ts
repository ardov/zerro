import {
  createSelector,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit'
import type { RootState } from './rootReducer'
import { appendClientCommand } from './data/slice'
import {
  replayOutbox,
  replayJournalPoint,
  listJournalHistory,
  type TCommand,
  type TJournalHistoryEntry,
  type TJournalPointRef,
  type TPersistedJournal,
} from 'zerro-core/replica'
import type { TDataStore } from '6-shared/types'

/** A point the history list can select: a journal point, or a position in the
 * durable local outbox (index is inclusive — keep `outbox[0..index]`). */
export type THistoryPointRef =
  { kind: 'journal'; ref: TJournalPointRef } | { kind: 'local'; index: number }

type THistoryState = {
  /**
   * Whether the history bar is open, which is deliberately not the same
   * question as whether a past point is selected. Stepping forward to the head
   * of the list lands on live data, and the bar has to survive that: a
   * navigation control that unmounts as a side effect of its own arrow leaves
   * the user with nothing under the finger they were pressing. Only an
   * explicit exit closes it.
   */
  browsing: boolean
  selectedPoint: THistoryPointRef | null
  /** Run ids the panel has expanded into individual points. Session-only. */
  expandedRuns: string[]
}

const initialState: THistoryState = {
  browsing: false,
  selectedPoint: null,
  expandedRuns: [],
}

const { reducer, actions } = createSlice({
  name: 'history',
  initialState,
  reducers: {
    selectHistoryPoint: (state, action: PayloadAction<THistoryPointRef>) => {
      state.browsing = true
      state.selectedPoint = action.payload
    },
    /** Jump to the head of the list. The bar stays open, so the user can keep
     * stepping back from here. */
    returnToCurrent: state => {
      state.selectedPoint = null
    },
    /** Leave history navigation entirely. The only thing that closes the bar. */
    exitHistoryBrowsing: state => {
      state.browsing = false
      state.selectedPoint = null
    },
    toggleHistoryRun: (state, action: PayloadAction<string>) => {
      const index = state.expandedRuns.indexOf(action.payload)
      if (index === -1) state.expandedRuns.push(action.payload)
      else state.expandedRuns.splice(index, 1)
    },
  },
  extraReducers: builder => {
    /**
     * A command can only be issued while the selection is not showing the
     * past — the write path blocks otherwise — so an append means the user was
     * effectively live, and the selection is stale by definition. Dropping it
     * keeps them there: a point ref pinned to an outbox index would stop being
     * the head the moment the outbox grew, silently rewinding the app to
     * before the change they just made. The bar stays open on `current`.
     */
    builder.addCase(appendClientCommand, state => {
      state.selectedPoint = null
    })
  },
})

export default reducer

export const {
  selectHistoryPoint,
  returnToCurrent,
  exitHistoryBrowsing,
  toggleHistoryRun,
} = actions

const selectHistory = (state: RootState) => state.history ?? initialState
const selectJournal = (state: RootState) => state.data.journal
const selectBase = (state: RootState) => state.data.base
const selectOutbox = (state: RootState) => state.data.outbox
const selectRedo = (state: RootState) => state.data.redo

export const selectIsBrowsingHistory = (state: RootState) =>
  selectHistory(state).browsing

const selectStoredHistoryPoint = (state: RootState) =>
  selectHistory(state).selectedPoint

const selectExpandedRuns = (state: RootState) =>
  selectHistory(state).expandedRuns

// —————————————————————————————————————————————————————————————————————————
// Display rows
// —————————————————————————————————————————————————————————————————————————

export type THistoryRow =
  | { type: 'redo'; command: TCommand }
  | {
      type: 'local'
      command: TCommand
      point: Extract<THistoryPointRef, { kind: 'local' }>
    }
  | {
      type: 'journal'
      entry: TJournalHistoryEntry
      point: Extract<THistoryPointRef, { kind: 'journal' }>
      /** Shown under an expanded run header rather than at the top level. */
      nested?: boolean
    }
  /** A run of consecutive unpushed points from one branch, collapsed into one
   * row. Expanded, it stays as the header its own points hang under, so the
   * expansion can be undone. */
  | {
      type: 'run'
      id: string
      entries: TJournalHistoryEntry[]
      expanded: boolean
    }
  /** The boundary between the local stack and the journal. */
  | { type: 'divider' }

/** Every retained checkpoint and canonical server point, oldest first per branch. */
export const selectHistoryEntries = createSelector(
  [selectJournal],
  (journal): TJournalHistoryEntry[] =>
    journal ? listJournalHistory(journal) : []
)

/** The live tail only — session-only redo (furthest future first), then the
 * durable local outbox (most recent first). This is the whole sync-button
 * preview: it never reaches into journal history. */
export const selectLiveHistoryRows = createSelector(
  [selectRedo, selectOutbox],
  (redo, outbox): THistoryRow[] => {
    const redoRows: THistoryRow[] = redo.map(command => ({
      type: 'redo',
      command,
    }))
    const localRows: THistoryRow[] = outbox
      .map((command, index): THistoryRow => ({
        type: 'local',
        command,
        point: { kind: 'local', index },
      }))
      .reverse()
    return [...redoRows, ...localRows]
  }
)

/**
 * The full list top to bottom, exactly as the panel renders it: the live
 * tail above, then journal history (most recent first, consecutive unpushed
 * points from a background pull collapsed into one row unless the panel
 * expanded them). Not chronological — a background pull inserts a journal
 * point under unsent local commands even though it arrived later, because
 * `current = base + outbox`. The divider marks that boundary so the order is
 * not read as time.
 */
export const selectHistoryRows = createSelector(
  [selectLiveHistoryRows, selectHistoryEntries, selectExpandedRuns],
  (liveRows, entries, expandedRuns): THistoryRow[] => {
    const journalRows = groupJournalRows(
      [...entries].reverse(),
      new Set(expandedRuns)
    )
    const divider: THistoryRow[] =
      liveRows.length && journalRows.length ? [{ type: 'divider' }] : []
    return [...liveRows, ...divider, ...journalRows]
  }
)

/** The point a row selects, or `null` for a row that is not a position: the
 * redo tail (undone, not visitable), the divider, and an expanded run header
 * whose points are rows of their own. A collapsed run stands in for its newest
 * point, which is what makes it one step rather than none. */
export function historyRowPoint(row: THistoryRow): THistoryPointRef | null {
  if (row.type === 'local' || row.type === 'journal') return row.point
  if (row.type === 'run' && !row.expanded)
    return { kind: 'journal', ref: row.entries[0].ref }
  return null
}

const selectSelectablePoints = createSelector(
  [selectHistoryRows],
  (rows): THistoryPointRef[] =>
    rows
      .map(historyRowPoint)
      .filter((point): point is THistoryPointRef => point !== null)
)

// —————————————————————————————————————————————————————————————————————————
// Selection
// —————————————————————————————————————————————————————————————————————————

/** The newest selectable row: the position live data sits at. */
export const selectHistoryHeadPoint = createSelector(
  [selectSelectablePoints],
  (points): THistoryPointRef | null => points[0] ?? null
)

/**
 * The selected point, or `null` when the selection is the head of the list.
 *
 * The head is not a point in the past — it is the live replica under another
 * name, so selecting it must leave data live and writes unblocked. Normalizing
 * here rather than at the dispatch site also covers the selection being
 * overtaken: an undo can shorten the outbox until the point the user picked
 * *is* the head, and the app has to become editable again without waiting for
 * them to notice.
 */
export const selectSelectedHistoryPoint = createSelector(
  [selectStoredHistoryPoint, selectHistoryHeadPoint],
  (point, head): THistoryPointRef | null =>
    point && head && sameHistoryPoint(point, head) ? null : point
)

/** The row the list marks as "you are here": the selected point, or the head
 * while the bar is open. */
export const selectHighlightedHistoryPoint = createSelector(
  [selectIsBrowsingHistory, selectSelectedHistoryPoint, selectHistoryHeadPoint],
  (browsing, selected, head): THistoryPointRef | null =>
    selected ?? (browsing ? head : null)
)

export const selectHistoryPointData = createSelector(
  [selectJournal, selectBase, selectOutbox, selectSelectedHistoryPoint],
  (journal, base, outbox, point): TDataStore | undefined =>
    point ? resolveHistoryPointData(journal, base, outbox, point) : undefined
)

export const selectDisplayedData = createSelector(
  [(state: RootState) => state.data.current, selectHistoryPointData],
  (current, point): TDataStore => point ?? current
)

export const selectIsHistoryPointVisible = (state: RootState) =>
  selectSelectedHistoryPoint(state) !== null &&
  selectHistoryPointData(state) !== undefined

/** The journal entry backing the current selection, if it is a journal point.
 * Carries the lazily-cached validation status a restore gates on. */
export const selectSelectedHistoryEntry = createSelector(
  [selectHistoryEntries, selectSelectedHistoryPoint],
  (entries, point): TJournalHistoryEntry | undefined => {
    if (point?.kind !== 'journal') return undefined
    return entries.find(
      entry =>
        entry.branchId === point.ref.branchId &&
        entry.ref.pointId === point.ref.pointId
    )
  }
)

/**
 * When the selected point was made: a local command's issue time, a journal
 * point's server timestamp. Not the replayed store's `serverTimestamp` — for a
 * local point that is the last sync, which is neither when the change was made
 * nor anything the user did.
 */
export const selectSelectedHistoryTime = createSelector(
  [selectSelectedHistoryPoint, selectOutbox, selectSelectedHistoryEntry],
  (point, outbox, entry): number | undefined => {
    if (!point) return undefined
    if (point.kind === 'local') return outbox[point.index]?.issuedAt
    return entry?.serverTimestamp
  }
)

/** True once a selected point can no longer be resolved — pruned by retention
 * (journal) or invalidated by a push that truncated the outbox (local). The
 * caller must say so rather than silently falling back to live data. */
export const selectSelectedHistoryEntryMissing = (state: RootState) =>
  selectSelectedHistoryPoint(state) !== null &&
  selectHistoryPointData(state) === undefined

/**
 * Where one step back or forward lands. A `null` selection is the head, so
 * `forward` is `null` there because there is nowhere newer to go — the arrow
 * disables instead of closing the bar. `back` is `null` at the oldest row, and
 * both are `null` once the selected point has disappeared from the list.
 */
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
    return a.ref.branchId === b.ref.branchId && a.ref.pointId === b.ref.pointId
  return false
}

function resolveHistoryPointData(
  journal: TPersistedJournal | null,
  base: TDataStore,
  outbox: readonly TCommand[],
  point: THistoryPointRef
): TDataStore | undefined {
  if (point.kind === 'local') {
    if (point.index < 0 || point.index >= outbox.length) return undefined
    return replayOutbox(base, outbox.slice(0, point.index + 1))
  }
  if (!journal) return undefined
  return replayJournalPoint(journal, point.ref)
}

function groupJournalRows(
  entries: TJournalHistoryEntry[],
  expandedRuns: ReadonlySet<string>
): THistoryRow[] {
  const rows: THistoryRow[] = []
  let run: TJournalHistoryEntry[] = []

  const flushRun = () => {
    if (!run.length) return
    if (run.length === 1) {
      rows.push(toJournalRow(run[0]))
    } else {
      const id = runId(run)
      const expanded = expandedRuns.has(id)
      rows.push({ type: 'run', id, entries: run, expanded })
      if (expanded) run.forEach(entry => rows.push(toJournalRow(entry, true)))
    }
    run = []
  }

  entries.forEach(entry => {
    const collapsible = entry.kind === 'sync' && !entry.pushed
    if (!collapsible) {
      flushRun()
      rows.push(toJournalRow(entry))
      return
    }
    if (run.length && run[0].branchId !== entry.branchId) flushRun()
    run.push(entry)
  })
  flushRun()

  return rows
}

function runId(run: TJournalHistoryEntry[]): string {
  return `${run[0].branchId}:${run[0].ref.pointId}`
}

function toJournalRow(
  entry: TJournalHistoryEntry,
  nested = false
): THistoryRow {
  return {
    type: 'journal',
    entry,
    point: { kind: 'journal', ref: entry.ref },
    nested,
  }
}
