import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import {
  acceptCanonicalPatch,
  appendCanonicalJournalPoint,
  appendOutbox,
  applyPatch,
  applyOutboxCommand,
  createJournalBranch,
  createEmptyDataStore,
  defaultJournalRetentionPolicy,
  redoOutbox,
  replayJournalBranch,
  replayOutbox,
  retainJournal,
  journalPersistenceVersion,
  replicaPersistenceVersion,
  validateDataStore,
  undoOutbox,
  type TCommand,
  type TPersistedJournal,
  type TPersistedReplica,
} from 'zerro-core/replica'
import { withPerf } from '6-shared/helpers/performance'
import type { TDataStore, TNormalizedPatch } from '6-shared/types'

interface DataSlice {
  current: TDataStore
  base: TDataStore
  /** Applied local commands. This is the durable undo stack and sync outbox. */
  outbox: TCommand[]
  /** Undone commands available only until reload, logout, or sync. */
  redo: TCommand[]
  /** Accepted server history; the live outbox remains separate. */
  journal: TPersistedJournal | null
  /** Do not overwrite a quarantined journal until a new server sync succeeds. */
  journalPersistenceBlocked: boolean
  /** A loaded active branch failed domain validation and needs full reload. */
  journalRecoveryRequired: boolean
  journalRecoveryReason: string | null
  inbox?: TServerInbox | null
}

export interface TServerInbox extends TNormalizedPatch {
  sentOutboxCount?: number
  fullReload?: boolean
}

// INITIAL STATE
const initialBase = createEmptyDataStore()
const initialState: DataSlice = {
  current: initialBase,
  base: initialBase,
  outbox: [],
  redo: [],
  journal: null,
  journalPersistenceBlocked: false,
  journalRecoveryRequired: false,
  journalRecoveryReason: null,
}

// SLICE
const { reducer, actions } = createSlice({
  name: 'data',
  initialState,
  reducers: {
    receiveServerPatch: withPerf(
      'receiveServerPatch',
      (state, { payload }: PayloadAction<TServerInbox>) => {
        state.inbox = payload
      }
    ),
    rebaseServerInbox: withPerf('rebaseServerInbox', state => {
      if (!state.inbox) return
      const { sentOutboxCount, fullReload, ...canonicalPatch } = state.inbox
      if (fullReload) {
        const checkpoint = applyPatch(createEmptyDataStore(), canonicalPatch)
        const branchId = getNextReloadBranchId(
          state.journal,
          checkpoint.serverTimestamp
        )
        const nextBranch = createJournalBranch(branchId, checkpoint)
        state.journal = {
          version: journalPersistenceVersion,
          activeBranchId: branchId,
          branches: state.journal
            ? [...state.journal.branches, nextBranch]
            : [nextBranch],
        }
        state.journal = retainPersistedJournal(
          state.journal,
          checkpoint.serverTimestamp
        )
        state.journalPersistenceBlocked = false
        state.journalRecoveryRequired = false
        state.journalRecoveryReason = null
        state.base = checkpoint
        state.current = replayOutbox(checkpoint, state.outbox)
        state.inbox = null
        return
      }
      const previousBase = state.base
      const accepted = acceptCanonicalPatch(
        { base: state.base, outbox: state.outbox, redo: state.redo },
        canonicalPatch,
        sentOutboxCount
      )

      state.base = accepted.base
      state.current = accepted.current
      state.outbox = accepted.outbox
      state.redo = accepted.redo
      if (state.journal) {
        const activeBranch = state.journal.branches.find(
          branch => branch.id === state.journal?.activeBranchId
        )
        if (activeBranch) {
          const pointId = getNextPointId(
            activeBranch,
            accepted.base.serverTimestamp
          )
          const nextBranch = appendCanonicalJournalPoint(
            activeBranch,
            previousBase,
            accepted.base,
            pointId
          )
          const nextJournal = {
            ...state.journal,
            branches: state.journal.branches.map(branch =>
              branch.id === nextBranch.id ? nextBranch : branch
            ),
          }
          state.journal = retainPersistedJournal(
            nextJournal,
            accepted.base.serverTimestamp
          )
          if (!state.journalRecoveryRequired) {
            state.journalPersistenceBlocked = false
          }
        }
      }
      state.inbox = null
    }),
    appendClientCommand: withPerf(
      'appendClientCommand',
      (state, { payload }: PayloadAction<TCommand>) => {
        const next = appendOutbox(state.outbox, payload)
        state.outbox = next.outbox
        state.redo = next.redo
        // `current` already reflects the durable outbox, so advancing by this
        // one entry is equivalent to a full replay but keeps unrelated entity
        // maps reference-stable for memoized selectors.
        state.current = applyOutboxCommand(state.current, payload)
      }
    ),
    prepareClientSync: withPerf('prepareClientSync', state => {
      state.redo = []
    }),
    undoClientCommand: withPerf('undoClientCommand', state => {
      if (!state.outbox.length) return
      const next = undoOutbox(state.outbox, state.redo)
      state.outbox = next.outbox
      state.redo = next.redo
      state.current = replayOutbox(state.base, state.outbox)
    }),
    redoClientCommand: withPerf('redoClientCommand', state => {
      if (!state.redo.length) return
      const next = redoOutbox(state.outbox, state.redo)
      state.outbox = next.outbox
      state.redo = next.redo
      state.current = replayOutbox(state.base, state.outbox)
    }),
    restorePersistedReplica: withPerf(
      'restorePersistedReplica',
      (state, { payload }: PayloadAction<TPersistedReplica | undefined>) => {
        if (
          !payload ||
          payload.version !== replicaPersistenceVersion ||
          payload.baseServerTimestamp !== state.base.serverTimestamp
        ) {
          state.outbox = []
          state.redo = []
          state.current = state.base
          return
        }

        state.outbox = [...payload.outbox]
        state.redo = []
        state.current = replayOutbox(state.base, state.outbox)
      }
    ),
    restorePersistedJournal: withPerf(
      'restorePersistedJournal',
      (
        state,
        {
          payload,
        }: PayloadAction<{
          journal?: TPersistedJournal
          preserveStored: boolean
        }>
      ) => {
        if (!payload.journal) {
          state.journal = createPersistedJournal(state.base)
          const isValid = setJournalValidation(state, state.base)
          state.journalPersistenceBlocked = payload.preserveStored || !isValid
          state.current = replayOutbox(state.base, state.outbox)
          return
        }

        const activeBranch = payload.journal.branches.find(
          branch => branch.id === payload.journal?.activeBranchId
        )
        if (!activeBranch) {
          state.journal = createPersistedJournal(state.base)
          state.journalPersistenceBlocked = true
          state.journalRecoveryRequired = true
          state.journalRecoveryReason = 'Active journal branch is missing'
          state.current = replayOutbox(state.base, state.outbox)
          return
        }

        state.journal = payload.journal
        state.journalPersistenceBlocked = false
        state.base = replayJournalBranch(activeBranch)
        const isValid = setJournalValidation(state, state.base)
        state.journalPersistenceBlocked = !isValid
        state.current = replayOutbox(state.base, state.outbox)
      }
    ),
    resetData: () => {
      return initialState
    },
  },
})

// REDUCER
export default reducer

// ACTIONS
export const {
  receiveServerPatch,
  rebaseServerInbox,
  appendClientCommand,
  prepareClientSync,
  undoClientCommand,
  redoClientCommand,
  restorePersistedReplica,
  restorePersistedJournal,
  resetData,
} = actions

function createPersistedJournal(base: TDataStore): TPersistedJournal {
  return {
    version: journalPersistenceVersion,
    activeBranchId: 'main',
    branches: [createJournalBranch('main', base)],
  }
}

function getNextPointId(
  branch: TPersistedJournal['branches'][number],
  serverTimestamp: number
): string {
  const prefix = `server:${serverTimestamp}`
  let pointId = prefix
  let suffix = 1
  while (branch.points.some(point => point.id === pointId)) {
    pointId = `${prefix}:${suffix}`
    suffix += 1
  }
  return pointId
}

function getNextReloadBranchId(
  journal: TPersistedJournal | null,
  serverTimestamp: number
): string {
  const prefix = `reload:${serverTimestamp}`
  let branchId = prefix
  let suffix = 1
  const branches = journal?.branches ?? []
  while (branches.some(branch => branch.id === branchId)) {
    branchId = `${prefix}:${suffix}`
    suffix += 1
  }
  return branchId
}

function retainPersistedJournal(
  journal: TPersistedJournal,
  serverTimestamp: number
): TPersistedJournal {
  return retainJournal(journal, serverTimestamp, defaultJournalRetentionPolicy)
    .journal
}

function setJournalValidation(state: DataSlice, base: TDataStore): boolean {
  const validation = validateDataStore(base)
  state.journalRecoveryRequired = !validation.ok
  state.journalRecoveryReason = validation.ok ? null : validation.reason
  return validation.ok
}
