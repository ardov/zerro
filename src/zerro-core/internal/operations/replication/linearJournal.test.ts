import { describe, expect, it } from 'vitest'
import { makeDemoStore } from '../../../support/demo'
import {
  makeStore,
  makeTransaction,
} from '../../../support/testing/zenmoneyTestData'
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

  it('restarts the replay at a later checkpoint', () => {
    const first = makeStore({
      serverTimestamp: 10,
      account: { cash: row({ id: 'cash', title: 'Cash' }) },
    })
    const second = makeStore({
      serverTimestamp: 20,
      account: { cash: row({ id: 'cash', title: 'Wallet' }) },
    })
    const restored = makeStore({
      serverTimestamp: 30,
      account: { card: row({ id: 'card', title: 'Card' }) },
    })
    const current = makeStore({
      serverTimestamp: 40,
      account: { card: row({ id: 'card', title: 'Main card' }) },
    })

    const entries = [
      createCheckpointEntry(7, 1, 'full-sync', first),
      createTransitionEntry(7, 2, first, second, false)!,
      createCheckpointEntry(7, 3, 'recovery', restored),
      createTransitionEntry(7, 4, restored, current, false)!,
    ]

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

describe('journal entry sizes', () => {
  const jsonBytes = (value: unknown) =>
    new TextEncoder().encode(JSON.stringify(value)).byteLength
  const relativeError = (entry: { byteSize: number }) => {
    const { byteSize, ...unsized } = entry
    const exact = jsonBytes(unsized)
    return Math.abs(byteSize - exact) / exact
  }

  it('estimates the demo account checkpoint within 2% of its JSON size', () => {
    const snapshot = makeDemoStore({ now: Date.parse('2026-05-15T12:00:00Z') })

    const entry = createCheckpointEntry(7, 1, 'full-sync', snapshot)

    expect(relativeError(entry)).toBeLessThan(0.02)
  })

  it('counts long ids and uneven rows in the estimate', () => {
    const id = (i: number) =>
      `${String(i).padStart(8, '0')}-4a1c-8b2d-9e3f-${String(i * 7919).padStart(12, '0')}`
    const transaction = Object.fromEntries(
      Array.from({ length: 3000 }, (_, i) => [
        id(i),
        makeTransaction({
          id: id(i),
          comment: i % 3 ? 'Кофе и булочка '.repeat(i % 7) : null,
          payee: i % 5 ? `Shop ${i}` : null,
        }),
      ])
    )
    const snapshot = makeStore({
      serverTimestamp: 10,
      account: { cash: row({ id: 'cash', title: 'Cash' }) },
      transaction,
    })

    const entry = createCheckpointEntry(7, 1, 'full-sync', snapshot)

    expect(relativeError(entry)).toBeLessThan(0.02)
  })

  it('measures a transition exactly', () => {
    const before = makeStore({
      serverTimestamp: 10,
      account: { cash: row({ id: 'cash', title: 'Cash' }) },
    })
    const after = makeStore({
      serverTimestamp: 20,
      account: { cash: row({ id: 'cash', title: 'Wallet' }) },
    })

    const entry = createTransitionEntry(7, 2, before, after, false)!

    expect(relativeError(entry)).toBe(0)
  })
})

function row<T extends { id: string | number }>(value: T) {
  return value as any
}
