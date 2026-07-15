import { describe, expect, it } from 'vitest'
import { makeTransaction } from '../../../testing/zenmoneyTestData'
import { makeEnvelope } from '../../../testing/zerroTestData'
import { TrType } from '../../zenmoney/transactions'
import { EnvType, envId } from '../envelope-id'
import {
  compileTransactionQuery,
  TrFilterMode,
  type TTransactionQuery,
  type TTransactionQueryContext,
} from './query'

const foodId = envId.get(EnvType.Tag, 'food')
const parentId = envId.get(EnvType.Tag, 'parent')

function makeContext(
  patch: Partial<TTransactionQueryContext> = {}
): TTransactionQueryContext {
  return {
    routing: {
      inBudgetAccountIds: new Set(['card']),
      debtAccountId: undefined,
      debtors: {},
    },
    envelopes: {
      [foodId]: makeEnvelope({ id: foodId, parent: parentId }),
      [parentId]: makeEnvelope({ id: parentId, children: [foodId] }),
    },
    keepingEnvelopeIds: new Set(),
    ...patch,
  }
}

describe('compileTransactionQuery', () => {
  it('combines intrinsic clauses and hides deleted transactions by default', () => {
    const query: TTransactionQuery = {
      clauses: [
        { kind: 'account', ids: ['card', 'cash'] },
        { kind: 'type', values: [TrType.Outcome] },
        { kind: 'search', value: 'coffee' },
        { kind: 'amount', gte: 10, lte: 20 },
      ],
    }
    const matches = compileTransactionQuery(query, makeContext())
    const transaction = makeTransaction({
      outcome: 15,
      outcomeAccount: 'card',
      comment: 'Coffee shop',
    })

    expect(matches(transaction)).toBe(true)
    expect(matches({ ...transaction, deleted: true })).toBe(false)
    expect(matches({ ...transaction, comment: 'Tea shop' })).toBe(false)
  })

  it('can include or select only deleted transactions', () => {
    const deleted = makeTransaction({ deleted: true })

    expect(
      compileTransactionQuery({
        clauses: [{ kind: 'deleted', mode: 'include' }],
      })(deleted)
    ).toBe(true)
    expect(
      compileTransactionQuery({
        clauses: [{ kind: 'deleted', mode: 'only' }],
      })(makeTransaction({ income: 1 }))
    ).toBe(false)
  })

  it('uses activity routing for envelope and general-income semantics', () => {
    const outcome = makeTransaction({
      outcome: 20,
      outcomeAccount: 'card',
      tag: ['food'],
    })
    const income = makeTransaction({
      income: 100,
      incomeAccount: 'card',
      tag: ['food'],
    })
    const context = makeContext()
    const envelopeQuery = compileTransactionQuery(
      {
        clauses: [
          {
            kind: 'activity',
            envelopeIds: [foodId],
            scope: 'self',
            mode: TrFilterMode.Envelope,
          },
        ],
      },
      context
    )
    const generalIncomeQuery = compileTransactionQuery(
      {
        clauses: [
          {
            kind: 'activity',
            envelopeIds: [foodId],
            scope: 'self',
            mode: TrFilterMode.GeneralIncome,
          },
        ],
      },
      context
    )

    expect(envelopeQuery(outcome)).toBe(true)
    expect(envelopeQuery(income)).toBe(false)
    expect(generalIncomeQuery(income)).toBe(true)
    expect(generalIncomeQuery(outcome)).toBe(false)
  })

  it('expands envelope trees once when compiling a clause', () => {
    const matches = compileTransactionQuery(
      {
        clauses: [
          {
            kind: 'activity',
            envelopeIds: [parentId],
            scope: 'tree',
            mode: TrFilterMode.Outcome,
          },
        ],
      },
      makeContext()
    )

    expect(
      matches(
        makeTransaction({
          outcome: 20,
          outcomeAccount: 'card',
          tag: ['food'],
        })
      )
    ).toBe(true)
  })

  it('matches internal transfer fees without an envelope id', () => {
    const matches = compileTransactionQuery(
      {
        clauses: [
          {
            kind: 'activity',
            envelopeIds: [],
            scope: 'self',
            mode: TrFilterMode.TransferFees,
            month: '2026-01',
          },
        ],
      },
      makeContext({
        routing: {
          inBudgetAccountIds: new Set(['card', 'cash']),
          debtAccountId: undefined,
          debtors: {},
        },
      })
    )

    expect(
      matches(
        makeTransaction({
          income: 9,
          outcome: 10,
          incomeAccount: 'cash',
          outcomeAccount: 'card',
        })
      )
    ).toBe(true)
  })
})
