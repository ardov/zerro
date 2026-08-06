import { describe, expect, it } from 'vitest'
import { makeStore } from '../../../support/testing/zenmoneyTestData'
import {
  applyCompactTransition,
  appendCanonicalJournalPoint,
  compactCanonicalTransition,
  compactJournalBranchAt,
  compactJournalAt,
  createJournalBranch,
  defaultJournalRetentionPolicy,
  estimateJournalBytes,
  listJournalHistory,
  replayJournalPoint,
  replayJournal,
  replayJournalBranch,
  retainJournal,
  type TCompactCanonicalTransition,
} from './journal'

describe('canonical journal transitions', () => {
  it('stores only changed entity fields and replay reproduces the target', () => {
    const before = makeStore({
      serverTimestamp: 10,
      account: {
        cash: row({ id: 'cash', title: 'Cash', balance: 100 }),
      },
      tag: {
        old: row({ id: 'old', title: 'Old' }),
      },
    })
    const after = makeStore({
      serverTimestamp: 11,
      account: {
        cash: row({ id: 'cash', title: 'Wallet', balance: 100 }),
        card: row({ id: 'card', title: 'Card' }),
      },
    })

    const transition = compactCanonicalTransition(before, after)

    expect(transition).toEqual({
      serverTimestamp: 11,
      upsert: {
        account: [
          { id: 'cash', fields: { title: 'Wallet' } },
          { id: 'card', fields: { title: 'Card' } },
        ],
      },
      deletion: [{ object: 'tag', id: 'old' }],
    })
    expect(applyCompactTransition(before, transition!)).toEqual(after)
  })

  it('represents removed optional fields explicitly', () => {
    const before = makeStore({
      account: {
        cash: row({ id: 'cash', title: 'Cash', note: 'temporary' }),
      },
    })
    const after = makeStore({
      account: {
        cash: row({ id: 'cash', title: 'Cash' }),
      },
    })

    const transition = compactCanonicalTransition(before, after)

    expect(transition).toEqual({
      upsert: {
        account: [{ id: 'cash', fields: {}, remove: ['note'] }],
      },
    })
    expect(applyCompactTransition(before, transition!)).toEqual(after)
  })

  it('returns no transition when snapshots are equal', () => {
    const snapshot = makeStore({ serverTimestamp: 10 })

    expect(compactCanonicalTransition(snapshot, snapshot)).toBeUndefined()
  })

  it('keeps a cursor-only transition separate from entity changes', () => {
    const before = makeStore({ serverTimestamp: 10 })
    const after = makeStore({ serverTimestamp: 11 })

    expect(compactCanonicalTransition(before, after)).toEqual({
      serverTimestamp: 11,
    })
  })

  it('accepts a typed transition as the replay input', () => {
    const before = makeStore()
    const transition: TCompactCanonicalTransition = {
      serverTimestamp: 10,
      upsert: { account: [{ id: 'cash', fields: { title: 'Cash' } }] },
    }

    expect(applyCompactTransition(before, transition).account.cash).toEqual({
      id: 'cash',
      title: 'Cash',
    })
  })

  it('replays transitions and compacts only at a transition boundary', () => {
    const checkpoint = makeStore({
      serverTimestamp: 1,
      account: { cash: row({ id: 'cash', title: 'Cash' }) },
    })
    const middle = makeStore({
      serverTimestamp: 2,
      account: { cash: row({ id: 'cash', title: 'Wallet' }) },
    })
    const after = makeStore({
      serverTimestamp: 3,
      account: { cash: row({ id: 'cash', title: 'Current' }) },
    })
    const transitions = [
      compactCanonicalTransition(checkpoint, middle),
      compactCanonicalTransition(middle, after),
    ] as TCompactCanonicalTransition[]

    expect(replayJournal(checkpoint, transitions)).toEqual(after)

    const compacted = compactJournalAt(checkpoint, transitions, 1)
    expect(compacted.checkpoint).toEqual(middle)
    expect(compacted.transitions).toEqual([transitions[1]])
    expect(replayJournal(compacted.checkpoint, compacted.transitions)).toEqual(
      after
    )
  })

  it('rejects compaction outside the transition list', () => {
    expect(() => compactJournalAt(makeStore(), [], 1)).toThrow(
      'Journal compaction count is out of range'
    )
  })

  it('keeps cursor-only pulls out of history while retaining the cursor', () => {
    const checkpoint = makeStore({ serverTimestamp: 10 })
    const branch = createJournalBranch('main', checkpoint)
    const after = makeStore({ serverTimestamp: 11 })

    const next = appendCanonicalJournalPoint(
      branch,
      checkpoint,
      after,
      'point-ignored',
      true
    )

    expect(next.points).toEqual([])
    expect(next.serverTimestamp).toBe(11)
    expect(replayJournalBranch(next).serverTimestamp).toBe(11)
  })

  it('appends a state-changing point and compacts a branch', () => {
    const checkpoint = makeStore({
      serverTimestamp: 1,
      account: { cash: row({ id: 'cash', title: 'Cash' }) },
    })
    const middle = makeStore({
      serverTimestamp: 2,
      account: { cash: row({ id: 'cash', title: 'Wallet' }) },
    })
    const after = makeStore({
      serverTimestamp: 3,
      account: { cash: row({ id: 'cash', title: 'Current' }) },
    })
    const branch = createJournalBranch('main', checkpoint)
    const withMiddle = appendCanonicalJournalPoint(
      branch,
      checkpoint,
      middle,
      'point-1',
      true
    )
    const withAfter = appendCanonicalJournalPoint(
      withMiddle,
      middle,
      after,
      'point-2',
      true
    )

    expect(withAfter.points).toHaveLength(2)
    expect(replayJournalBranch(withAfter)).toEqual(after)

    const compacted = compactJournalBranchAt(withAfter, 1)
    expect(compacted.checkpoint).toEqual(middle)
    expect(compacted.points).toHaveLength(1)
    expect(replayJournalBranch(compacted)).toEqual(after)
  })

  it('lists checkpoints and replays a selected point without the outbox', () => {
    const checkpoint = makeStore({
      serverTimestamp: 1,
      account: { cash: row({ id: 'cash', title: 'Cash' }) },
    })
    const middle = makeStore({
      serverTimestamp: 2,
      account: { cash: row({ id: 'cash', title: 'Wallet' }) },
    })
    const after = makeStore({
      serverTimestamp: 3,
      account: { cash: row({ id: 'cash', title: 'Current' }) },
    })
    const branch = appendCanonicalJournalPoint(
      appendCanonicalJournalPoint(
        createJournalBranch('main', checkpoint),
        checkpoint,
        middle,
        'point-2',
        false
      ),
      middle,
      after,
      'point-3',
      true
    )
    const journal = { activeBranchId: 'main', branches: [branch] }

    expect(listJournalHistory(journal).map(entry => entry.ref.pointId)).toEqual(
      [null, 'point-2', 'point-3']
    )
    expect(listJournalHistory(journal).map(entry => entry.pushed)).toEqual([
      true, // the checkpoint is always shown, never collapsed
      false, // point-2 came from a pull
      true, // point-3 came from a push
    ])
    expect(
      replayJournalPoint(journal, { branchId: 'main', pointId: 'point-2' })
    ).toEqual(middle)
    expect(
      replayJournalPoint(journal, { branchId: 'main', pointId: 'missing' })
    ).toBeUndefined()
  })

  it('compacts points older than the retention cutoff on every branch', () => {
    const old = makeStore({
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
    const branch = appendCanonicalJournalPoint(
      appendCanonicalJournalPoint(
        createJournalBranch('main', old),
        old,
        middle,
        'point-20',
        true
      ),
      middle,
      current,
      'point-30',
      true
    )
    const journal = {
      activeBranchId: 'main',
      branches: [branch],
    }

    const retained = retainJournal(journal, 40, {
      maxAgeMs: 15,
      softMaxBytes: 1024 * 1024,
      hardMaxBytes: 2 * 1024 * 1024,
    })

    expect(retained.journal.branches[0].points.map(point => point.id)).toEqual([
      'point-30',
    ])
    expect(replayJournalBranch(retained.journal.branches[0])).toEqual(current)
  })

  it('drops oldest sealed branches to respect the hard byte budget', () => {
    const makeBranch = (id: string, timestamp: number) =>
      createJournalBranch(
        id,
        makeStore({
          serverTimestamp: timestamp,
          account: { cash: row({ id: 'cash', title: id.repeat(40) }) },
        })
      )
    const journal = {
      activeBranchId: 'current',
      branches: [makeBranch('old', 10), makeBranch('current', 30)],
    }
    const withoutOld = {
      ...journal,
      branches: [journal.branches[1]],
    }

    const retained = retainJournal(journal, 30, {
      maxAgeMs: 1_000,
      softMaxBytes: estimateJournalBytes(withoutOld),
      hardMaxBytes: estimateJournalBytes(withoutOld),
    })

    expect(retained.journal.branches.map(branch => branch.id)).toEqual([
      'current',
    ])
    expect(retained.hardLimitExceeded).toBe(false)
  })

  it('reports an active checkpoint that cannot fit the hard budget', () => {
    const journal = {
      activeBranchId: 'main',
      branches: [
        createJournalBranch(
          'main',
          makeStore({
            serverTimestamp: 10,
            account: { cash: row({ id: 'cash', title: 'Cash'.repeat(100) }) },
          })
        ),
      ],
    }

    const retained = retainJournal(journal, 10, {
      maxAgeMs: defaultJournalRetentionPolicy.maxAgeMs,
      softMaxBytes: 1,
      hardMaxBytes: 1,
    })

    expect(retained.hardLimitExceeded).toBe(true)
    expect(retained.serializedBytes).toBeGreaterThan(1)
    expect(retained.compressionRecommended).toBe(true)
  })
})

function row<T extends { id: string | number }>(value: T) {
  return value as any
}
