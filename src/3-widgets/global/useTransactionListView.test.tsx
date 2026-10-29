import { act, renderHook } from '@testing-library/react'
import { useState, type PropsWithChildren } from 'react'
import { Provider } from 'react-redux'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeStoryStore } from 'stories/fixtures/storyStore'
import { core } from '@/zerro-core/redux'
import {
  useTransactionListView,
  type TransactionListViewState,
} from './useTransactionListView'

type ListValue = {
  initialQuery?: core.transactions.TTransactionQuery
  view?: TransactionListViewState
}

function setup(initial: ListValue = {}) {
  const store = makeStoryStore('transaction-filters')
  const Wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={store}>{children}</Provider>
  )
  const hook = renderHook(
    () => {
      const [value, setValue] = useState(initial)
      return { value, ...useTransactionListView(value, setValue) }
    },
    { wrapper: Wrapper }
  )
  return { ...hook, store }
}

afterEach(() => vi.useRealTimers())

describe('transaction list instance view', () => {
  it('restores an independent query, search, selection and exact scroll from its serialized value', () => {
    const first = setup({
      initialQuery: {
        clauses: [
          { kind: 'merchant', ids: ['lidl'] },
          { kind: 'search', value: 'lunch' },
        ],
      },
    })
    expect(first.result.current.view).toMatchObject({
      query: { clauses: [{ kind: 'merchant', ids: ['lidl'] }] },
      search: 'lunch',
    })
    act(() => {
      first.result.current.view.onQueryChange({
        clauses: [{ kind: 'account', ids: ['HSBC USD'] }],
      })
      first.result.current.view.onSearchChange('groceries')
      first.result.current.view.onCheckedChange(['lunch', 'dinner'])
      first.result.current.view.onScrollChange('2026-10-09', 647)
      first.result.current.flushScroll()
    })
    const saved = JSON.parse(
      JSON.stringify(first.result.current.value)
    ) as ListValue
    first.unmount()
    const restored = setup(saved)
    expect(restored.result.current.view).toMatchObject({
      query: { clauses: [{ kind: 'account', ids: ['HSBC USD'] }] },
      search: 'groceries',
      checked: ['lunch', 'dinner'],
      restoredTopDate: '2026-10-09',
      restoredScrollOffset: 647,
    })
    const fresh = setup()
    expect(fresh.result.current.view).toMatchObject({
      query: { clauses: [] },
      search: '',
      checked: [],
      restoredScrollOffset: null,
    })
  })

  it('coalesces scrolling and flushes the latest native offset before reload', () => {
    vi.useFakeTimers()
    const { result } = setup()
    const initial = result.current.value
    act(() => {
      result.current.view.onScrollChange('2026-10-09', 100)
      result.current.view.onScrollChange('2026-10-09', 647)
      vi.advanceTimersByTime(199)
    })
    expect(result.current.value).toBe(initial)
    act(() => window.dispatchEvent(new Event('beforeunload')))
    expect(result.current.view).toMatchObject({
      restoredTopDate: '2026-10-09',
      restoredScrollOffset: 647,
    })
    act(() => result.current.view.onScrollChange('2026-10-09', 800))
    act(() => vi.advanceTimersByTime(200))
    expect(result.current.view.restoredScrollOffset).toBe(800)
  })

  it('drops a missing selected transaction while preserving the other checked ids', () => {
    const { result, store } = setup()
    act(() => result.current.view.onCheckedChange(['lunch', 'dinner']))
    act(() => store.dispatch(core.transactions.removePermanently(['dinner'])))
    expect(result.current.view.checked).toEqual(['lunch'])
  })
})
