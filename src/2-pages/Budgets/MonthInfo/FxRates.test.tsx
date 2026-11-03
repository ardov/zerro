import '@testing-library/jest-dom/vitest'
import { configureStore } from '@reduxjs/toolkit'
import { fireEvent, render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { afterEach, expect, it, vi } from 'vitest'
import { rootReducer } from '@/store/rootReducer'
import { makeTestRootState } from '@/store/testing'
import { core } from '@/zerro-core/redux'
import {
  makeAccount,
  makeInstrument,
  makeReminder,
  makeStore,
  makeTransaction,
  makeUser,
} from '@/zerro-core/support/testing/zenmoneyTestData'
import { FxRates } from './FxRates'

afterEach(() => vi.useRealTimers())

it('edits a whole SOL held outside the budget at the end of the selected month', () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2025-10-15T12:00:00Z'))
  const data = makeStore({
    user: { 1: makeUser({ id: 1, parent: null, currency: 1 }) },
    instrument: {
      1: makeInstrument({ id: 1, shortTitle: 'USD', rate: 80 }),
      2: makeInstrument({
        id: 2,
        shortTitle: 'SOL',
        symbol: 'μSOL',
        rate: 0.008,
      }),
    },
    account: {
      cash: makeAccount({ id: 'cash', inBalance: true, balance: 50 }),
      wallet: makeAccount({
        id: 'wallet',
        instrument: 2,
        inBalance: false,
        balance: 0,
      }),
    },
    transaction: {
      buy: makeTransaction({
        id: 'buy',
        date: '2025-08-01',
        income: 2_000_000,
        incomeAccount: 'wallet',
        outcomeAccount: 'wallet',
        incomeInstrument: 2,
        outcomeInstrument: 2,
      }),
      sell: makeTransaction({
        id: 'sell',
        date: '2025-09-01',
        outcome: 2_000_000,
        incomeAccount: 'wallet',
        outcomeAccount: 'wallet',
        incomeInstrument: 2,
        outcomeInstrument: 2,
      }),
    },
    reminder: {
      rates: makeReminder('rates', {
        type: 'fxRates',
        month: '2025-07',
        payload: {
          date: '2025-07',
          changed: 1,
          rates: { USD: 1, SOL: 0.000125 },
        },
      }),
    },
  })
  const store = configureStore({
    reducer: rootReducer,
    preloadedState: makeTestRootState(data),
  })
  const editor = (month: '2025-08' | '2025-09') => (
    <Provider store={store}>
      <FxRates month={month} />
    </Provider>
  )
  const view = render(editor('2025-08'))
  const field = screen.getByRole('textbox', { name: 'SOL / USD' })
  expect(field).toHaveValue('125')
  fireEvent.change(field, { target: { value: '127,5' } })
  fireEvent.blur(field)
  const convert = core.currency.selectDisplayConverter(store.getState())
  expect(convert({ SOL: 2_000_000 }, '2025-08')).toBe(255)
  expect(field).toHaveValue('127.5')

  fireEvent.click(screen.getByRole('button', { name: /USD/ }))
  const inverse = screen.getByRole('textbox', { name: 'USD / SOL' })
  expect(Number((inverse as HTMLInputElement).value)).toBeCloseTo(1 / 127.5, 10)
  fireEvent.change(inverse, { target: { value: '0.01' } })
  fireEvent.blur(inverse)
  expect(
    core.currency.selectDisplayConverter(store.getState())(
      { SOL: 1_000_000 },
      '2025-08'
    )
  ).toBe(100)

  view.rerender(editor('2025-09'))
  expect(
    screen.queryByRole('textbox', { name: 'SOL / USD' })
  ).not.toBeInTheDocument()
})
