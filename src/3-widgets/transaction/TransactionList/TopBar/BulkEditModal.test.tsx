import '@testing-library/jest-dom'
import type { TTransaction } from '6-shared/types'
import { configureStore } from '@reduxjs/toolkit'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { Provider } from 'react-redux'
import i18n from 'i18next'
import { beforeAll, describe, expect, test, vi } from 'vitest'
import dataReducer from 'store/data'
import { trModel } from '5-entities/transaction'
import { BulkEditModal } from './BulkEditModal'

beforeAll(async () => {
  await i18n.changeLanguage('en')
})

const makeTr = (id: string, comment: string | null): TTransaction =>
  trModel.makeTransaction({
    id,
    user: 0,
    date: '2022-10-20',
    incomeInstrument: 2,
    incomeAccount: 'acc1',
    outcomeInstrument: 2,
    outcomeAccount: 'acc1',
    outcome: 100,
    comment,
  })

const createTestStore = (transactions: TTransaction[]) =>
  configureStore({
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
          transaction: Object.fromEntries(transactions.map(tr => [tr.id, tr])),
        },
      },
    },
  })

const getComment = (store: ReturnType<typeof createTestStore>, id: string) =>
  store.getState().data.current.transaction[id].comment

const commentField = () => screen.getByRole('textbox')
const saveButton = () => screen.getByRole('button', { name: 'Apply Changes' })

/**
 * The modal lives permanently in the tree and gets ids only when the user
 * selects transactions, so tests open it the same way the app does.
 */
const renderAndOpen = (
  store: ReturnType<typeof createTestStore>,
  ids: string[]
) => {
  const modal = (props: { ids: string[]; open: boolean }) => (
    <Provider store={store}>
      <BulkEditModal {...props} onClose={vi.fn()} onApply={vi.fn()} />
    </Provider>
  )
  const { rerender } = render(modal({ ids: [], open: false }))
  rerender(modal({ ids, open: true }))
}

describe('BulkEditModal', () => {
  test('shows the current comment of the selected transaction', () => {
    const store = createTestStore([makeTr('tr1', 'Old comment')])
    renderAndOpen(store, ['tr1'])
    expect(commentField()).toHaveValue('Old comment')
  })

  test('clears the comment when the field is emptied', async () => {
    const store = createTestStore([makeTr('tr1', 'Old comment')])
    renderAndOpen(store, ['tr1'])
    await userEvent.clear(commentField())
    await userEvent.click(saveButton())
    expect(getComment(store, 'tr1')).toBe(null)
  })

  test('does not touch comments when the field is left untouched', async () => {
    const store = createTestStore([
      makeTr('tr1', 'One'),
      makeTr('tr2', 'Another'),
    ])
    renderAndOpen(store, ['tr1', 'tr2'])
    await userEvent.click(saveButton())
    expect(getComment(store, 'tr1')).toBe('One')
    expect(getComment(store, 'tr2')).toBe('Another')
  })
})
