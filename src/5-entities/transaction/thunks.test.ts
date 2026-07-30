import type { TTransaction } from '6-shared/types'
import { configureStore } from '@reduxjs/toolkit'
import { describe, expect, test } from 'vitest'
import dataReducer from 'store/data'
import { makeTransaction } from './makeTransaction'
import { bulkEditTransactions } from './thunks'

const makeTr = (comment: string | null): TTransaction =>
  makeTransaction({
    id: 'tr1',
    user: 0,
    date: '2022-10-20',
    incomeInstrument: 2,
    incomeAccount: 'acc1',
    outcomeInstrument: 2,
    outcomeAccount: 'acc1',
    outcome: 100,
    tag: ['tag1'],
    comment,
  })

const createTestStore = (tr: TTransaction) =>
  configureStore<{ data: ReturnType<typeof dataReducer> }, any>({
    reducer: { data: dataReducer },
    preloadedState: {
      data: {
        current: {
          serverTimestamp: 0,
          instrument: {},
          country: {},
          company: {},
          user: {},
          merchant: {},
          account: {},
          tag: {},
          budget: {},
          reminder: {},
          reminderMarker: {},
          transaction: { [tr.id]: tr },
        },
      },
    },
  })

const getComment = (store: ReturnType<typeof createTestStore>) =>
  store.getState().data.current.transaction.tr1.comment

describe('bulkEditTransactions', () => {
  test('sets a comment', () => {
    const store = createTestStore(makeTr(null))
    store.dispatch(bulkEditTransactions(['tr1'], { comment: 'New comment' }))
    expect(getComment(store)).toBe('New comment')
  })

  test('clears a comment when an empty string is passed', () => {
    const store = createTestStore(makeTr('Old comment'))
    store.dispatch(bulkEditTransactions(['tr1'], { comment: '' }))
    expect(getComment(store)).toBe(null)
  })

  test('keeps the comment when it is not passed', () => {
    const store = createTestStore(makeTr('Old comment'))
    store.dispatch(bulkEditTransactions(['tr1'], { tags: ['tag2'] }))
    expect(getComment(store)).toBe('Old comment')
  })

  test('supports the $& placeholder for the previous comment', () => {
    const store = createTestStore(makeTr('Old comment'))
    store.dispatch(bulkEditTransactions(['tr1'], { comment: '$& and more' }))
    expect(getComment(store)).toBe('Old comment and more')
  })
})
