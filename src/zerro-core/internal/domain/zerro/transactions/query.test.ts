import { describe, expect, it } from 'vitest'
import { makeTransaction } from '../../../../support/testing/zenmoneyTestData'
import { makeEnvelope } from '../../../../support/testing/zerroTestData'
import { TrType } from '../../zenmoney/entities/transactions'
import { EnvType, envId } from '../envelope-id'
import {
  compileTransactionQuery,
  TrFilterMode,
  TrFilterType,
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
  it('requires every search word across the operation and its named entities', () => {
    const context = makeContext({
      search: {
        accounts: { card: { title: 'Travel card' } },
        tags: { food: { title: 'Groceries' } },
        merchants: { shop: { title: 'Lidl' } },
      },
    })
    const transaction = makeTransaction({
      outcome: 15,
      outcomeAccount: 'card',
      tag: ['food'],
      merchant: 'shop',
      comment: 'Lunch',
      payee: 'STORE 42',
      originalPayee: 'LIDL CYPRUS',
    })
    const search = (value: string) =>
      compileTransactionQuery({ clauses: [{ kind: 'search', value }] }, context)
    expect(search(' LIDL grocer travel LUNCH ')(transaction)).toBe(true)
    expect(search('cyprus 42')(transaction)).toBe(true)
    expect(search('lidl rent')(transaction)).toBe(false)
    expect(search('lidll')(transaction)).toBe(false)
  })

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

  it('searches exact amounts on active legs and in original currencies', () => {
    const search = (value: string) =>
      compileTransactionQuery({ clauses: [{ kind: 'search', value }] })
    const expense = makeTransaction({
      outcome: 12,
      income: 0,
      comment: null,
      payee: null,
    })
    expect(search('12,00')(expense)).toBe(true)
    expect(search('12.00')(expense)).toBe(true)
    expect(search('12')({ ...expense, outcome: 120 })).toBe(false)
    expect(search('12')({ ...expense, outcome: 12.5 })).toBe(false)
    expect(search('0')(expense)).toBe(false)
    expect(
      search('12')({
        ...expense,
        outcome: 20,
        opOutcome: 12,
        opOutcomeInstrument: 1,
      })
    ).toBe(true)
    expect(
      search('12')({
        ...expense,
        income: 12,
        outcome: 20,
        incomeAccount: 'cash',
        outcomeAccount: 'card',
      })
    ).toBe(true)
    expect(
      search('12')({ ...expense, outcome: 20, comment: 'Receipt 1234' })
    ).toBe(true)
  })

  it('intersects merchant selection, search, and inclusive normalized dates', () => {
    const query: TTransactionQuery = {
      clauses: [
        { kind: 'merchant', ids: ['lidl', 'other'] },
        { kind: 'search', value: 'lunch' },
        { kind: 'date', from: '2026-10-20', to: '2026-10-05' },
      ],
    }
    const matches = compileTransactionQuery(query)
    const transaction = makeTransaction({
      outcome: 12,
      merchant: 'lidl',
      comment: 'Lunch',
      date: '2026-10-05',
    })
    expect(matches(transaction)).toBe(true)
    expect(
      matches({ ...transaction, date: '2026-10-20', merchant: 'other' })
    ).toBe(true)
    expect(matches({ ...transaction, date: '2026-10-21' })).toBe(false)
    expect(matches({ ...transaction, merchant: null })).toBe(false)
    expect(matches({ ...transaction, comment: 'Dinner' })).toBe(false)
    expect(
      compileTransactionQuery({ clauses: [{ kind: 'merchant', ids: [null] }] })(
        { ...transaction, merchant: null, payee: 'Legacy name' }
      )
    ).toBe(true)
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

  it('groups both debt directions under the product debt filter', () => {
    const matches = compileTransactionQuery(
      { clauses: [{ kind: 'type', values: [TrFilterType.Debt] }] },
      makeContext({
        routing: {
          inBudgetAccountIds: new Set(['card']),
          debtAccountId: 'debt',
          debtors: {},
        },
      })
    )

    expect(
      matches(makeTransaction({ incomeAccount: 'debt', outcome: 10 }))
    ).toBe(true)
    expect(
      matches(makeTransaction({ outcomeAccount: 'debt', income: 10 }))
    ).toBe(true)
    expect(
      matches(makeTransaction({ outcomeAccount: 'card', income: 10 }))
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

describe('last-modified transaction filter', () => {
  // March includes a DST boundary in many user timezones.
  const now = new Date(2026, 2, 30, 12).getTime()
  const midnight = (day: number) => new Date(2026, 2, day).getTime()
  it.each([
    ['today', 30, 31],
    ['yesterday', 29, 30],
    ['7d', 24, 31],
    ['14d', 17, 31],
    ['30d', 1, 31],
  ] as const)(
    '%s matches local calendar boundaries using changed, not operation date',
    (period, from, before) => {
      const matches = compileTransactionQuery(
        { clauses: [{ kind: 'changed', period }] },
        undefined,
        now
      )
      const transaction = makeTransaction({ date: '2020-01-01', outcome: 1 })
      expect(matches({ ...transaction, changed: midnight(from) - 1 })).toBe(
        false
      )
      expect(matches({ ...transaction, changed: midnight(from) })).toBe(true)
      expect(matches({ ...transaction, changed: midnight(before) - 1 })).toBe(
        true
      )
      expect(matches({ ...transaction, changed: midnight(before) })).toBe(false)
    }
  )
  it('combines changed with date and search, and leaves an empty draft neutral', () => {
    const transaction = makeTransaction({
      changed: midnight(30),
      outcome: 1,
      date: '2026-01-01',
      comment: 'Lunch',
    })
    const query: TTransactionQuery = {
      clauses: [
        { kind: 'changed', period: 'today' },
        { kind: 'date', from: '2026-01-01', to: '2026-01-01' },
        { kind: 'search', value: 'Lunch' },
      ],
    }
    const matches = compileTransactionQuery(query, undefined, now)
    expect(matches(transaction)).toBe(true)
    expect(matches({ ...transaction, comment: 'Dinner' })).toBe(false)
    expect(matches({ ...transaction, date: '2026-01-02' })).toBe(false)
    expect(
      compileTransactionQuery({ clauses: [{ kind: 'changed' }] })(transaction)
    ).toBe(true)
  })
})
