import { performance } from 'node:perf_hooks'
import { describe, expect, it } from 'vitest'
import { createZerroSession } from '../../../application/session/createZerroSession'
import { makeDemoStore } from '../../../demo'
import { getDebtAccountId } from '../../zenmoney'
import { compareTransactionDates } from '../../zenmoney/transactions'
import { getZerroInBudgetAccountIds } from '../accounts'
import { compileTransactionQuery, TrFilterMode } from '../transactions'

describe('activity projection performance', () => {
  it('reports retained transaction slots and projection cost', () => {
    const store = makeDemoStore({ scale: 20 })
    const ctx = {
      now: () => Date.parse('2026-07-06T12:00:00.000Z'),
      uuid: () => 'benchmark-id',
    }
    const durations: number[] = []

    for (let iteration = 0; iteration < 5; iteration += 1) {
      const session = createZerroSession(store, ctx)
      const startedAt = performance.now()
      session.activity.getRaw()
      session.activity.getAll()
      session.envelopes.getMetrics()
      session.activity.getSorted()
      durations.push(performance.now() - startedAt)
    }

    forceGc()
    const heapBefore = process.memoryUsage().heapUsed
    const session = createZerroSession(store, ctx)
    const projections = [
      session.activity.getRaw(),
      session.activity.getAll(),
      session.envelopes.getMetrics(),
      session.activity.getSorted(),
    ]
    forceGc()
    const heapAfter = process.memoryUsage().heapUsed
    const retained = countRetainedTransactionSlots(projections)
    const sortedDurations = [...durations].sort((left, right) => left - right)

    const queryDurations: number[] = []
    const sortedActivity = session.activity.getSorted()
    const sampleEnvelope = Object.values(sortedActivity).flatMap(
      month => month.outcomes
    )[0]
    const sampleEnvelopeId =
      sampleEnvelope?.id === 'transferFees' ? undefined : sampleEnvelope?.id
    const predicate = compileTransactionQuery(
      {
        clauses: sampleEnvelopeId
          ? [
              {
                kind: 'activity',
                envelopeIds: [sampleEnvelopeId],
                scope: 'tree',
                mode: TrFilterMode.All,
              },
            ]
          : [],
      },
      {
        routing: {
          inBudgetAccountIds: new Set(getZerroInBudgetAccountIds(store)),
          debtAccountId: getDebtAccountId(store),
          debtors: session.debtors.getAll(),
        },
        envelopes: session.envelopes.getAll(),
        keepingEnvelopeIds: new Set(session.envelopes.getKeepingIds()),
      }
    )
    let queryMatches = 0

    for (let iteration = 0; iteration < 11; iteration += 1) {
      const startedAt = performance.now()
      queryMatches = session.transactions
        .getHistory()
        .filter(predicate)
        .sort(compareTransactionDates).length
      queryDurations.push(performance.now() - startedAt)
    }
    queryDurations.sort((left, right) => left - right)

    console.log(
      'ACTIVITY_AFTER',
      JSON.stringify({
        transactions: Object.keys(store.transaction).length,
        medianMs: Number(sortedDurations[2].toFixed(2)),
        heapDeltaBytes: heapAfter - heapBefore,
        transactionArrays: retained.arrays,
        transactionSlots: retained.slots,
        queryMedianMs: Number(queryDurations[5].toFixed(2)),
        queryMatches,
      })
    )

    expect(retained.slots).toBe(0)
  })
})

function forceGc() {
  ;(globalThis as typeof globalThis & { gc?: () => void }).gc?.()
}

function countRetainedTransactionSlots(value: unknown): {
  arrays: number
  slots: number
} {
  const seen = new WeakSet<object>()
  let arrays = 0
  let slots = 0

  const visit = (node: unknown) => {
    if (!node || typeof node !== 'object' || seen.has(node)) return
    seen.add(node)

    for (const [key, child] of Object.entries(node)) {
      if (key === 'transactions' && Array.isArray(child)) {
        arrays += 1
        slots += child.length
        continue
      }
      visit(child)
    }
  }

  visit(value)
  return { arrays, slots }
}
