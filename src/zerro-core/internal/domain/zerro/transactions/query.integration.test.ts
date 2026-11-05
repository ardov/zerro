import { describe, expect, it } from 'vitest'
import { createZerroSession } from '../../../../public/session/createZerroSession'
import { makeDemoStore } from '../../../../support/demo'
import type { TISOMonth } from '../../zenmoney/primitives'
import type { TEnvelopeId } from '../envelope-id'
import { TrFilterMode } from './query'

describe('transaction query integration', () => {
  it('reconstructs activity and envelope transaction counts on demand', () => {
    // One representative year covers recurring income, outcome, transfer,
    // debt, and envelope shapes without making this parity check repeatedly
    // scan the full four-year demo history for every projection node.
    const store = makeDemoStore({ until: '2023-06-19' })
    const session = createZerroSession(store, {
      now: () => Date.parse('2026-07-06T12:00:00.000Z'),
      uuid: () => 'query-integration-id',
    })
    Object.entries(session.activity.getSorted()).forEach(
      ([month, activity]) => {
        const isoMonth = month as TISOMonth
        const nodes = [
          ...activity.incomes,
          ...activity.outcomes,
          ...activity.transfers,
          ...activity.debts,
        ]

        nodes.forEach(node => {
          const envelopeIds: TEnvelopeId[] =
            node.id === 'transferFees' ? [] : [node.id]
          const transactions = session.transactions.query({
            clauses: [
              {
                kind: 'activity',
                envelopeIds,
                scope: 'self',
                mode: node.trMode,
                month: isoMonth,
              },
            ],
          })

          expect(transactions).toHaveLength(node.total.transactionCount)
        })
      }
    )

    Object.entries(session.envelopes.getMetrics()).forEach(
      ([month, metrics]) => {
        const isoMonth = month as TISOMonth
        Object.values(metrics).forEach(metric => {
          const transactions = session.transactions.query({
            clauses: [
              {
                kind: 'activity',
                envelopeIds: [metric.id],
                scope: 'tree',
                mode: TrFilterMode.Envelope,
                month: isoMonth,
              },
            ],
          })

          expect(transactions).toHaveLength(metric.totalTransactionCount)
        })
      }
    )
  })
})
