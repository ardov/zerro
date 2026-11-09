import { configureStore } from '@reduxjs/toolkit'
import { makeCoreNextDemoRootState } from '@/zerro-core/support/testing/demoState'
import { createEmptyDataStore } from '@/zerro-core/replica'
import { makeTestRootState } from '@/store/testing'
import { rootReducer } from '@/store/rootReducer'
import {
  makeAccount,
  makeStore,
  makeTag,
  makeUser,
  makeReminder,
  makeMerchant,
  makeInstrument,
  makeTransaction,
} from '@/zerro-core/support/testing/zenmoneyTestData'

export type StoryScenario =
  | 'debtor-navigation'
  | 'transaction-filters'
  | 'transaction-navigation'
  | 'receipt-and-map'
  | 'demo'
  | 'off-budget-transfers'
  | 'small-currency-amounts'
  | 'empty'
  | 'recovery'
  | 'persistence-warning'

export function makeStoryStore(scenario: StoryScenario = 'demo') {
  const demoState = makeCoreNextDemoRootState()

  const preloadedState = (() => {
    switch (scenario) {
      case 'debtor-navigation': {
        const current = demoState.data.current
        const loan = {
          date: '2026-03-20' as const,
          incomeAccount: 'Debts',
          outcomeAccount: 'HSBC USD',
          income: 100,
          outcome: 100,
          incomeInstrument: 1,
          outcomeInstrument: 1,
        }
        return makeCoreNextDemoRootState({
          ...current,
          instrument: {
            ...current.instrument,
            999: makeInstrument({ id: 999, shortTitle: 'EUR', symbol: '€' }),
          },
          merchant: { alex: makeMerchant({ id: 'alex', title: 'Alex' }) },
          transaction: {
            loan: makeTransaction({
              ...loan,
              id: 'loan',
              merchant: 'alex',
              comment: 'Alex dollar loan',
            }),
            repayment: makeTransaction({
              ...loan,
              id: 'repayment',
              payee: 'Alex',
              incomeAccount: 'HSBC USD',
              outcomeAccount: 'Debts',
              income: 20,
              outcome: 18,
              outcomeInstrument: 999,
              comment: 'Alex dollar repayment',
            }),
            euro: makeTransaction({
              ...loan,
              id: 'euro',
              payee: 'Alex',
              incomeInstrument: 999,
              outcomeInstrument: 999,
              comment: 'Alex euro loan',
            }),
            other: makeTransaction({
              ...loan,
              id: 'other',
              payee: 'Bob',
              comment: 'Bob loan',
            }),
          },
        })
      }
      case 'transaction-navigation': {
        const current = demoState.data.current
        return makeCoreNextDemoRootState({
          ...current,
          transaction: Object.fromEntries(
            Array.from({ length: 80 }, (_, index) => {
              const id = `purchase-${index}`
              return [
                id,
                makeTransaction({
                  id,
                  date: '2026-10-09',
                  created: index,
                  comment: `Purchase ${index}`,
                  outcome: 12,
                  incomeAccount: 'HSBC USD',
                  outcomeAccount: 'HSBC USD',
                  tag: ['Food'],
                  incomeInstrument: 1,
                  outcomeInstrument: 1,
                }),
              ]
            })
          ),
        })
      }
      case 'transaction-filters': {
        const current = demoState.data.current
        const expense = {
          date: '2026-10-09' as const,
          outcome: 12,
          incomeAccount: 'HSBC USD',
          outcomeAccount: 'HSBC USD',
          tag: ['Food'],
          incomeInstrument: 1,
          outcomeInstrument: 1,
        }
        return makeCoreNextDemoRootState({
          ...current,
          merchant: {
            lidl: makeMerchant({ id: 'lidl', title: 'Lidl' }),
            other: makeMerchant({ id: 'other', title: 'Other shop' }),
          },
          transaction: {
            lunch: makeTransaction({
              ...expense,
              id: 'lunch',
              merchant: 'lidl',
              comment: 'Lunch groceries',
            }),
            dinner: makeTransaction({
              ...expense,
              id: 'dinner',
              merchant: 'lidl',
              comment: 'Dinner groceries',
            }),
            other: makeTransaction({
              ...expense,
              id: 'other',
              merchant: 'other',
              comment: 'Lunch elsewhere',
            }),
            legacy: makeTransaction({
              ...expense,
              id: 'legacy',
              payee: 'Legacy café',
              comment: 'Coffee',
            }),
          },
        })
      }
      case 'receipt-and-map': {
        const current = demoState.data.current
        const transaction = Object.values(current.transaction).find(
          item => item.outcome > 0 && item.income === 0 && !item.deleted
        )!
        return makeCoreNextDemoRootState({
          ...current,
          transaction: {
            ...current.transaction,
            [transaction.id]: {
              ...transaction,
              qrCode:
                't=20260320T1430&s=1299.00&fn=9287440301110113&i=19313&fp=1992968429&n=1',
              latitude: 55.7558,
              longitude: 37.6173,
            },
          },
        })
      }
      case 'off-budget-transfers': {
        // Transfers between two budget accounts cancel out in the overview.
        // An off-budget destination keeps the transfer card visible.
        const current = demoState.data.current
        return makeCoreNextDemoRootState({
          ...current,
          account: {
            ...current.account,
            'N26 EUR': { ...current.account['N26 EUR'], inBalance: false },
          },
        })
      }
      case 'small-currency-amounts': {
        const wallet = {
          incomeAccount: 'wallet',
          outcomeAccount: 'wallet',
          incomeInstrument: 2,
          outcomeInstrument: 2,
        }
        const month = '2026-01'
        return makeTestRootState(
          makeStore({
            user: { 1: makeUser({ id: 1, parent: null, currency: 1 }) },
            instrument: {
              1: makeInstrument({ id: 1, shortTitle: 'USD', rate: 1 }),
              2: makeInstrument({
                id: 2,
                shortTitle: 'DASH',
                symbol: 'μDASH',
                rate: 0.00004,
              }),
            },
            account: {
              wallet: makeAccount({
                id: 'wallet',
                instrument: 2,
                inBalance: true,
              }),
              savings: makeAccount({
                id: 'savings',
                instrument: 2,
                inBalance: true,
              }),
            },
            tag: {
              purchases: makeTag({ id: 'purchases', title: 'Purchases' }),
              refunds: makeTag({ id: 'refunds', title: 'Refunds' }),
            },
            transaction: {
              purchase: makeTransaction({
                ...wallet,
                id: 'purchase',
                outcome: 0.0201,
                tag: ['purchases'],
              }),
              refund: makeTransaction({
                ...wallet,
                id: 'refund',
                income: 0.02,
                tag: ['refunds'],
              }),
              transfer: makeTransaction({
                ...wallet,
                id: 'transfer',
                incomeAccount: 'savings',
                income: 1,
                outcome: 1.01,
              }),
            },
            reminder: {
              meta: makeReminder('meta', {
                type: 'EnvelopeMeta',
                payload: {
                  'tag#purchases': { currency: 'DASH' },
                  'tag#refunds': { currency: 'DASH', keepIncome: true },
                },
              }),
              budget: makeReminder('budget', {
                type: 'budgets',
                month,
                payload: { 'tag#purchases': 0.01 },
              }),
              goal: makeReminder('goal', {
                type: 'goals',
                month,
                payload: { 'tag#purchases': { type: 'monthly', amount: 0.02 } },
              }),
            },
          })
        )
      }
      case 'empty':
        return {
          ...demoState,
          data: {
            ...demoState.data,
            current: createEmptyDataStore(),
            base: createEmptyDataStore(),
          },
        }
      case 'recovery':
        return {
          ...demoState,
          data: {
            ...demoState.data,
            journalRecoveryRequired: true,
            journalRecoveryReason: 'Storybook recovery fixture',
          },
        }
      case 'persistence-warning':
        return {
          ...demoState,
          data: {
            ...demoState.data,
            persistenceWarning: 'Storybook persistence fixture',
          },
        }
      case 'demo':
        return demoState
    }
  })()

  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        immutableCheck: false,
        serializableCheck: false,
      }),
  })
}
