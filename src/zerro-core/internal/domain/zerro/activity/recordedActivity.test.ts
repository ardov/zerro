import { describe, expect, it } from 'vitest'
import { createZerroSession } from '../../../../public/session/createZerroSession'
import {
  makeAccount,
  makeInstrument,
  makeReminder,
  makeStore,
  makeTag,
  makeTransaction,
  makeUser,
  usdInstruments,
} from '../../../../support/testing/zenmoneyTestData'
import type { TDataStore } from '../../zenmoney'
import { EnvType, envId } from '../envelope-id'
import { goalType } from '../goals'
import { HiddenDataType } from '../hidden-data'
import { TrFilterMode } from './sortedActivity'

const month = '2026-01'
const instruments = {
  ...usdInstruments,
  2: makeInstrument({ id: 2, shortTitle: 'RUB', rate: 0.0125 }),
  3: makeInstrument({ id: 3, shortTitle: 'GEL', rate: 0.4 }),
}

function makeSession(data: Partial<TDataStore>) {
  return createZerroSession(
    makeStore({
      instrument: instruments,
      user: { 1: makeUser({ id: 1, parent: null, currency: 2 }) },
      account: { card: makeAccount({ id: 'card', inBalance: true }) },
      ...data,
    }),
    { now: () => Date.parse('2026-01-31T12:00:00Z'), uuid: () => 'id' }
  )
}

describe('recorded FX for envelope activity', () => {
  it('values a GEL expense at its recorded RUB amount and reconciles native funds', () => {
    const food = envId.get(EnvType.Tag, 'food')
    const session = makeSession({
      account: {
        card: makeAccount({
          id: 'card',
          instrument: 3,
          inBalance: true,
          balance: 7.02,
        }),
      },
      tag: { food: makeTag({ id: 'food' }) },
      transaction: {
        purchase: makeTransaction({
          id: 'purchase',
          outcome: 2.98,
          outcomeInstrument: 3,
          opOutcome: 91,
          opOutcomeInstrument: 2,
          tag: ['food'],
        }),
      },
    })

    expect(session.envelopes.getMetrics()[month][food]).toMatchObject({
      selfActivity: { RUB: -91 },
      selfAvailable: { RUB: -91 },
      selfTransactionCount: 1,
    })
    const activity = session.activity.getAll()[month]
    const byEnv = activity.envActivity.byEnv[food]
    expect((byEnv.envelope ?? byEnv).trend[9]).toEqual({ RUB: -91 })
    expect(session.activity.getSorted()[month].outcomesTotal).toEqual({
      total: { RUB: -91 },
      transactionCount: 1,
    })
    expect(activity.total).toEqual({ GEL: -2.98 })

    expect(session.months.getTotals()[month]).toMatchObject({
      fundsStart: { GEL: 10 },
      fundsChange: { GEL: -2.98 },
      fundsEnd: { GEL: 7.02 },
      envActivity: { GEL: -2.98 },
      transferFees: {},
      generalIncome: {},
      available: { RUB: -91 },
      toBeAssigned: { GEL: 7.02, RUB: 91 },
    })
  })

  it('uses the off-budget leg in either direction before the original amount', () => {
    const wallet = envId.get(EnvType.Account, 'wallet')
    const session = makeSession({
      account: {
        card: makeAccount({ id: 'card', inBalance: true }),
        wallet: makeAccount({ id: 'wallet', instrument: 2 }),
      },
      reminder: {
        meta: makeReminder('meta', {
          type: HiddenDataType.EnvelopeMeta,
          payload: { [wallet]: { keepIncome: true } },
        }),
      },
      transaction: {
        sent: makeTransaction({
          id: 'sent',
          outcome: 100,
          incomeAccount: 'wallet',
          income: 8000,
          incomeInstrument: 2,
          opOutcome: 9000,
          opOutcomeInstrument: 2,
        }),
        returned: makeTransaction({
          id: 'returned',
          date: '2026-01-11',
          outcomeAccount: 'wallet',
          outcome: 300,
          outcomeInstrument: 2,
          incomeAccount: 'card',
          income: 5,
          opIncome: 400,
          opIncomeInstrument: 2,
        }),
      },
    })

    const activity = session.activity.getAll()[month]
    expect(activity.envActivity.total).toEqual({ USD: -95 })
    expect(activity.transferFees.total).toEqual({})
    const byEnv = activity.envActivity.byEnv[wallet]
    expect((byEnv.envelope ?? byEnv).trend.slice(9, 11)).toEqual([
      { RUB: -8000 },
      { RUB: 300 },
    ])
    expect(session.envelopes.getMetrics()[month][wallet].selfActivity).toEqual({
      RUB: -7700,
    })
    expect(session.activity.getSorted()[month].transfers).toEqual([
      {
        id: wallet,
        trMode: TrFilterMode.All,
        total: { total: { RUB: -7700 }, transactionCount: 2 },
      },
    ])
  })

  it.each([
    {
      technicalInstrument: 2,
      opIncome: null,
      expected: { USD: 20 },
      available: 1600,
    },
    {
      technicalInstrument: 2,
      opIncome: 1500,
      expected: { RUB: 1500 },
      available: 1500,
    },
  ])(
    'values a debt repayment from the real leg or its original amount: %j',
    ({ technicalInstrument, opIncome, expected, available }) => {
      const debtor = envId.get(EnvType.Payee, 'alex')
      const session = makeSession({
        account: {
          card: makeAccount({ id: 'card', inBalance: true }),
          debt: makeAccount({
            id: 'debt',
            type: 'debt',
            instrument: technicalInstrument,
          }),
        },
        reminder: {
          meta: makeReminder('meta', {
            type: HiddenDataType.EnvelopeMeta,
            payload: { [debtor]: { keepIncome: true } },
          }),
        },
        transaction: {
          repayment: makeTransaction({
            id: 'repayment',
            payee: 'Alex',
            incomeAccount: 'card',
            income: 20,
            outcomeAccount: 'debt',
            outcome: 20,
            outcomeInstrument: technicalInstrument,
            opIncome,
            opIncomeInstrument: 2,
          }),
        },
      })

      expect(session.activity.getAll()[month].total).toEqual({ USD: 20 })
      expect(session.activity.getSorted()[month].debtsTotal.total).toEqual(
        expected
      )
      expect(session.envelopes.getMetrics()[month][debtor]).toMatchObject({
        selfActivity: expected,
        selfAvailable: { RUB: available },
      })
    }
  )

  it('uses the adjusted keepIncome net for the row, income summary and income goal', () => {
    const project = envId.get(EnvType.Tag, 'project')
    const refund = envId.get(EnvType.Tag, 'refund')
    const salary = envId.get(EnvType.Tag, 'salary')
    const session = makeSession({
      tag: {
        project: makeTag({ id: 'project' }),
        refund: makeTag({ id: 'refund' }),
        salary: makeTag({ id: 'salary' }),
      },
      reminder: {
        meta: makeReminder('meta', {
          type: HiddenDataType.EnvelopeMeta,
          payload: {
            [project]: { keepIncome: true },
            [refund]: { keepIncome: true },
          },
        }),
        goal: makeReminder('goal', {
          type: HiddenDataType.Goals,
          month,
          payload: {
            [project]: { type: goalType.INCOME_PERCENT, amount: 0.1 },
          },
        }),
      },
      transaction: {
        projectIncome: makeTransaction({
          id: 'projectIncome',
          incomeAccount: 'card',
          income: 100,
          opIncome: 2000,
          opIncomeInstrument: 2,
          tag: ['project'],
        }),
        projectOutcome: makeTransaction({
          id: 'projectOutcome',
          outcome: 50,
          opOutcome: 4000,
          opOutcomeInstrument: 2,
          tag: ['project'],
        }),
        refund: makeTransaction({
          id: 'refund',
          incomeAccount: 'card',
          income: 2,
          opIncome: 300,
          opIncomeInstrument: 2,
          tag: ['refund'],
        }),
        salary: makeTransaction({
          id: 'salary',
          incomeAccount: 'card',
          income: 10,
          opIncome: 900,
          opIncomeInstrument: 2,
          tag: ['salary'],
        }),
      },
    })

    const sorted = session.activity.getSorted()[month]
    expect(sorted.outcomes).toEqual([
      {
        id: project,
        trMode: TrFilterMode.Envelope,
        total: { total: { RUB: -2000 }, transactionCount: 2 },
      },
    ])
    expect(sorted.incomes).toEqual([
      {
        id: salary,
        trMode: TrFilterMode.GeneralIncome,
        total: { total: { USD: 10 }, transactionCount: 1 },
      },
      {
        id: refund,
        trMode: TrFilterMode.Envelope,
        total: { total: { RUB: 300 }, transactionCount: 1 },
      },
    ])
    expect(sorted.incomesTotal).toEqual({
      total: { USD: 10, RUB: 300 },
      transactionCount: 2,
    })
    const generalIncome = session.activity.getAll()[month].generalIncome
    expect(generalIncome.total).toEqual({ USD: 10 })
    expect(generalIncome.byEnv[salary].total).toEqual({ USD: 10 })
    expect(generalIncome.byEnv[salary].trend[9]).toEqual({ USD: 10 })
    expect(session.goals.getAll()[month][project].targetBudget).toBe(110)
  })
})
