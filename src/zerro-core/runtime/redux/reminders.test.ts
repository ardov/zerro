import { configureStore } from '@reduxjs/toolkit'
import { expect, it } from 'vitest'
import { undoClientCommand } from '@/store/data'
import { rootReducer } from '@/store/rootReducer'
import { makeTestRootState } from '@/store/testing'
import {
  makeAccount,
  makeStore,
  makeUser,
} from '../../support/testing/zenmoneyTestData'
import { remove, set } from './reminders'

it('creates, edits and removes a reminder as separate undoable changes', () => {
  const current = makeStore({
    user: { 1: makeUser({ id: 1, parent: null, currency: 1 }) },
    account: {
      cash: makeAccount({ id: 'cash' }),
      card: makeAccount({ id: 'card' }),
    },
  })
  const store = configureStore({
    reducer: rootReducer,
    preloadedState: makeTestRootState(current),
  })

  const [receipt] = store.dispatch(
    set({ incomeAccount: 'cash', outcomeAccount: 'card', comment: 'Rent' })
  )
  const { id } = receipt
  const getReminder = () => store.getState().data.current.reminder[id]
  expect(getReminder()).toMatchObject({
    user: 1,
    incomeAccount: 'cash',
    outcomeAccount: 'card',
    comment: 'Rent',
  })

  store.dispatch(set({ id, comment: 'Updated' }))
  expect(getReminder()).toMatchObject({
    incomeAccount: 'cash',
    outcomeAccount: 'card',
    comment: 'Updated',
  })

  store.dispatch(remove(id))
  expect(getReminder()).toBeUndefined()
  const deleted = store.getState()
  store.dispatch(remove(id))
  expect(store.getState()).toBe(deleted)

  store.dispatch(undoClientCommand())
  expect(getReminder()?.comment).toBe('Updated')
  store.dispatch(undoClientCommand())
  expect(getReminder()?.comment).toBe('Rent')
  store.dispatch(undoClientCommand())
  expect(getReminder()).toBeUndefined()
})
