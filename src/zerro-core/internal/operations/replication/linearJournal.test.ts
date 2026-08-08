import { describe, expect, it } from 'vitest'
import { makeStore } from '../../../support/testing/zenmoneyTestData'
import {
  compactJournalEntries,
  createCheckpointEntry,
  createTransitionEntry,
  replayJournalEntries,
} from './linearJournal'

describe('linear canonical journal', () => {
  it('replays a checkpoint and canonical transition in sequence order', () => {
    const checkpoint = makeStore({
      serverTimestamp: 10,
      account: { cash: row({ id: 'cash', title: 'Cash' }) },
    })
    const current = makeStore({
      serverTimestamp: 20,
      account: { cash: row({ id: 'cash', title: 'Wallet' }) },
    })

    const entries = [
      createCheckpointEntry(7, 1, 'full-sync', checkpoint),
      createTransitionEntry(7, 2, checkpoint, current, true)!,
    ]

    expect(entries[1]).toMatchObject({
      rootUserId: 7,
      sequence: 2,
      kind: 'transition',
      serverTimestamp: 20,
      pushed: true,
    })
    expect(replayJournalEntries(entries)).toEqual(current)
  })

  it('keeps a cursor-only pull out of the journal', () => {
    const before = makeStore({ serverTimestamp: 10 })
    const after = makeStore({ serverTimestamp: 20 })

    expect(createTransitionEntry(7, 2, before, after, false)).toBeUndefined()
  })

  it('keeps a pushed boundary even when the canonical state is unchanged', () => {
    const snapshot = makeStore({ serverTimestamp: 10 })

    expect(createTransitionEntry(7, 2, snapshot, snapshot, true)).toMatchObject(
      {
        sequence: 2,
        kind: 'transition',
        pushed: true,
        transition: {},
      }
    )
  })

  it('folds only the supplied prefix into a retention checkpoint', () => {
    const initial = makeStore({
      serverTimestamp: 10,
      account: { cash: row({ id: 'cash', title: 'Cash' }) },
    })
    const middle = makeStore({
      serverTimestamp: 20,
      account: { cash: row({ id: 'cash', title: 'Wallet' }) },
    })
    const current = makeStore({
      serverTimestamp: 30,
      account: { cash: row({ id: 'cash', title: 'Current' }) },
    })
    const entries = [
      createCheckpointEntry(7, 10, 'full-sync', initial),
      createTransitionEntry(7, 11, initial, middle, false)!,
      createTransitionEntry(7, 12, middle, current, true)!,
    ]

    const compacted = compactJournalEntries(entries)

    expect(compacted).toMatchObject({
      rootUserId: 7,
      sequence: 12,
      kind: 'checkpoint',
      serverTimestamp: 30,
      reason: 'retention',
    })
    expect(compacted.snapshot).toEqual(current)
    expect(compacted.byteSize).toBeGreaterThan(0)
  })
})

function row<T extends { id: string | number }>(value: T) {
  return value as any
}
