import { configureStore } from '@reduxjs/toolkit'
import { act, renderHook } from '@testing-library/react'
import type { FC, PropsWithChildren } from 'react'
import { Provider } from 'react-redux'
import { afterEach, describe, expect, it, vi } from 'vitest'
import view, { resetViews } from '@/store/view'

import { useTransactionsPageView } from './useTransactionsPageView'

function makeWrapper() {
  const store = configureStore({ reducer: { view } })
  const Wrapper: FC<PropsWithChildren> = ({ children }) => (
    <Provider store={store}>{children}</Provider>
  )
  return { store, Wrapper }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('useTransactionsPageView', () => {
  it('restores the page view when its consumer remounts', () => {
    const { Wrapper } = makeWrapper()
    const first = renderHook(() => useTransactionsPageView(), {
      wrapper: Wrapper,
    })

    act(() => {
      first.result.current.onQueryChange({
        clauses: [{ kind: 'account', ids: ['account'] }],
      })
      first.result.current.onSearchChange('coffee')
      first.result.current.onCheckedChange(['a', 'b', 'c', 'd', 'e'])
      first.result.current.onScrollChange('2026-07-23', 1873)
    })
    first.unmount()

    const restored = renderHook(() => useTransactionsPageView(), {
      wrapper: Wrapper,
    })
    expect(restored.result.current).toMatchObject({
      query: { clauses: [{ kind: 'account', ids: ['account'] }] },
      search: 'coffee',
      restoredTopDate: '2026-07-23',
      restoredScrollOffset: 1873,
      checked: ['a', 'b', 'c', 'd', 'e'],
    })
  })

  it('saves the position once scrolling settles, including movement within a day', () => {
    vi.useFakeTimers()
    const { store, Wrapper } = makeWrapper()
    const { result } = renderHook(() => useTransactionsPageView(), {
      wrapper: Wrapper,
    })
    const view = result.current

    act(() => {
      view.onScrollChange('2026-07-23', 1873)
      view.onScrollChange('2026-07-23', 2345)
      view.onScrollChange('2026-07-23', 3456)
    })
    expect(store.getState().view.transactionsPage).toMatchObject({
      topDate: null,
      scrollOffset: null,
    })
    expect(result.current).toBe(view)

    act(() => vi.advanceTimersByTime(1000))
    expect(store.getState().view.transactionsPage).toMatchObject({
      topDate: '2026-07-23',
      scrollOffset: 3456,
    })
  })

  it('drops a pending position when the views are reset before unmount', () => {
    vi.useFakeTimers()
    const { store, Wrapper } = makeWrapper()
    const { result, unmount } = renderHook(() => useTransactionsPageView(), {
      wrapper: Wrapper,
    })

    act(() => result.current.onScrollChange('2026-07-21', 3456))
    act(() => {
      store.dispatch(resetViews())
    })
    unmount()
    act(() => vi.advanceTimersByTime(1000))

    expect(store.getState().view.transactionsPage).toMatchObject({
      topDate: null,
      scrollOffset: null,
    })
  })

  it('starts from defaults in a new store', () => {
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useTransactionsPageView(), {
      wrapper: Wrapper,
    })

    expect(result.current).toMatchObject({
      query: { clauses: [] },
      search: '',
      restoredTopDate: null,
      restoredScrollOffset: null,
      checked: [],
    })
  })
})
