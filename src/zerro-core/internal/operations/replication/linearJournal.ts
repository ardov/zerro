import type { TDataStore } from '../../domain/zenmoney'
import {
  applyCompactTransition,
  compactCanonicalTransition,
  type TCompactCanonicalTransition,
} from './journal'

export type TCheckpointReason = 'full-sync' | 'recovery' | 'retention'

export type TCheckpointEntry = {
  rootUserId: number
  sequence: number
  kind: 'checkpoint'
  serverTimestamp: number
  byteSize: number
  reason: TCheckpointReason
  snapshot: TDataStore
}

export type TTransitionEntry = {
  rootUserId: number
  sequence: number
  kind: 'transition'
  serverTimestamp: number
  byteSize: number
  pushed: boolean
  transition: TCompactCanonicalTransition
}

export type TJournalEntry = TCheckpointEntry | TTransitionEntry

type TUnsizedCheckpointEntry = Omit<TCheckpointEntry, 'byteSize'>
type TUnsizedTransitionEntry = Omit<TTransitionEntry, 'byteSize'>

export function createCheckpointEntry(
  rootUserId: number,
  sequence: number,
  reason: TCheckpointReason,
  snapshot: TDataStore
): TCheckpointEntry {
  return withByteSize({
    rootUserId,
    sequence,
    kind: 'checkpoint',
    serverTimestamp: snapshot.serverTimestamp,
    reason,
    snapshot,
  })
}

export function createTransitionEntry(
  rootUserId: number,
  sequence: number,
  before: TDataStore,
  after: TDataStore,
  pushed: boolean
): TTransitionEntry | undefined {
  const transition = compactCanonicalTransition(before, after)
  const hasStateChange = Boolean(transition?.upsert || transition?.deletion)
  if (!hasStateChange && !pushed) return undefined

  return withByteSize({
    rootUserId,
    sequence,
    kind: 'transition',
    serverTimestamp: after.serverTimestamp,
    pushed,
    transition: transition ?? {},
  })
}

export function replayJournalEntries(
  entries: readonly TJournalEntry[]
): TDataStore {
  let snapshot: TDataStore | undefined

  entries.forEach(entry => {
    snapshot =
      entry.kind === 'checkpoint'
        ? entry.snapshot
        : applyCompactTransition(requireCheckpoint(snapshot), entry.transition)
  })

  return requireCheckpoint(snapshot)
}

export function compactJournalEntries(
  entries: readonly TJournalEntry[]
): TCheckpointEntry {
  const last = entries[entries.length - 1]
  if (!last) throw new Error('Journal compaction batch is empty')

  return createCheckpointEntry(
    last.rootUserId,
    last.sequence,
    'retention',
    replayJournalEntries(entries)
  )
}

const textEncoder = new TextEncoder()

function withByteSize(entry: TUnsizedCheckpointEntry): TCheckpointEntry
function withByteSize(entry: TUnsizedTransitionEntry): TTransitionEntry
function withByteSize(
  entry: TUnsizedCheckpointEntry | TUnsizedTransitionEntry
): TJournalEntry {
  return {
    ...entry,
    byteSize: textEncoder.encode(JSON.stringify(entry)).byteLength,
  } as TJournalEntry
}

function requireCheckpoint(snapshot: TDataStore | undefined): TDataStore {
  if (!snapshot) throw new Error('Journal replay must start from a checkpoint')
  return snapshot
}
