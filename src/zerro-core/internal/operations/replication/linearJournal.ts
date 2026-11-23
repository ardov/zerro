import { dataEntityKeys, type TDataStore } from '../../domain/zenmoney'
import {
  applyCompactTransitions,
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

type TUnsizedTransitionEntry = Omit<TTransitionEntry, 'byteSize'>

export function createCheckpointEntry(
  rootUserId: number,
  sequence: number,
  reason: TCheckpointReason,
  snapshot: TDataStore
): TCheckpointEntry {
  return {
    rootUserId,
    sequence,
    kind: 'checkpoint',
    serverTimestamp: snapshot.serverTimestamp,
    byteSize: estimateSnapshotBytes(snapshot),
    reason,
    snapshot,
  }
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

  const entry: TUnsizedTransitionEntry = {
    rootUserId,
    sequence,
    kind: 'transition',
    serverTimestamp: after.serverTimestamp,
    pushed,
    transition: transition ?? {},
  }
  return { ...entry, byteSize: jsonBytes(entry) }
}

export function replayJournalEntries(
  entries: readonly TJournalEntry[]
): TDataStore {
  let snapshot: TDataStore | undefined
  let suffix: TCompactCanonicalTransition[] = []

  // A checkpoint is a full state: it replaces the snapshot and starts a new
  // suffix. The final suffix is applied as one run.
  entries.forEach(entry => {
    if (entry.kind === 'checkpoint') {
      snapshot = entry.snapshot
      suffix = []
    } else {
      requireCheckpoint(snapshot)
      suffix.push(entry.transition)
    }
  })

  return applyCompactTransitions(requireCheckpoint(snapshot), suffix)
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

function jsonBytes(value: unknown): number {
  return textEncoder.encode(JSON.stringify(value)).byteLength
}

const SIZE_SAMPLE_ROWS = 64

/** Sample evenly spaced rows for JSON byte size so retention need not serialize the whole checkpoint. */
function estimateSnapshotBytes(snapshot: TDataStore): number {
  let bytes = jsonBytes({ serverTimestamp: snapshot.serverTimestamp })
  dataEntityKeys.forEach(object => {
    const rows = snapshot[object] as Record<string, unknown>
    const ids = Object.keys(rows)
    // The map's own `"object":{}` and the comma before it.
    bytes += object.length + 6
    if (!ids.length) return
    const step = Math.max(1, Math.floor(ids.length / SIZE_SAMPLE_ROWS))
    const sample: Record<string, unknown> = {}
    let sampled = 0
    for (let i = 0; i < ids.length && sampled < SIZE_SAMPLE_ROWS; i += step) {
      sample[ids[i]] = rows[ids[i]]
      sampled++
    }
    // Bytes per `"id":{…},` in the sample; the map's braces are counted above.
    const perRow = (jsonBytes(sample) - 1) / sampled
    bytes += perRow * ids.length - 1
  })
  return Math.round(bytes)
}

function requireCheckpoint(snapshot: TDataStore | undefined): TDataStore {
  if (!snapshot) throw new Error('Journal replay must start from a checkpoint')
  return snapshot
}
