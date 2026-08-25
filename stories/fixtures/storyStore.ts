import { configureStore } from '@reduxjs/toolkit'
import { makeCoreNextDemoRootState } from 'zerro-core/support/testing/demoState'
import { createEmptyDataStore } from 'zerro-core/replica'
import { rootReducer } from 'store/rootReducer'

export type StoryScenario =
  'demo' | 'empty' | 'recovery' | 'persistence-warning'

export function makeStoryStore(scenario: StoryScenario = 'demo') {
  const demoState = makeCoreNextDemoRootState()

  const preloadedState = (() => {
    switch (scenario) {
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
