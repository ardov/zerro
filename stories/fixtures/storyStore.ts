import { configureStore } from '@reduxjs/toolkit'
import { makeCoreNextDemoRootState } from '@/zerro-core/support/testing/demoState'
import { createEmptyDataStore } from '@/zerro-core/replica'
import { rootReducer } from '@/store/rootReducer'
import {
  makeMerchant,
  makeTransaction,
} from '@/zerro-core/support/testing/zenmoneyTestData'

export type StoryScenario =
  | 'transaction-filters'
  | 'receipt-and-map'
  | 'demo'
  | 'off-budget-transfers'
  | 'empty'
  | 'recovery'
  | 'persistence-warning'

export function makeStoryStore(scenario: StoryScenario = 'demo') {
  const demoState = makeCoreNextDemoRootState()

  const preloadedState = (() => {
    switch (scenario) {
      case 'transaction-filters': {
        const current = demoState.data.current
        const expense = {
          date: '2026-10-09' as const,
          outcome: 12,
          incomeAccount: 'Cash USD',
          outcomeAccount: 'Cash USD',
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
            'Cash RUB': { ...current.account['Cash RUB'], inBalance: false },
          },
        })
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
