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
      first.result.current.onQueryChange({ clauses: [] })
      first.result.current.onSearchChange('coffee')
      first.result.current.onTopDateChange('2026-07-23')
    })
    first.unmount()

    const restored = renderHook(() => useTransactionsPageView(), {
      wrapper: Wrapper,
    })
    expect(restored.result.current).toMatchObject({
      query: { clauses: [] },
      search: 'coffee',
      restoredTopDate: '2026-07-23',
    })
  })

  it('saves the top date once scrolling settles, not on every day', () => {
    vi.useFakeTimers()
    const { store, Wrapper } = makeWrapper()
    const { result } = renderHook(() => useTransactionsPageView(), {
      wrapper: Wrapper,
    })
    const view = result.current

    act(() => {
      view.onTopDateChange('2026-07-23')
      view.onTopDateChange('2026-07-22')
      view.onTopDateChange('2026-07-21')
    })
    expect(store.getState().view.transactionsPage.topDate).toBeNull()
    expect(result.current).toBe(view)

    act(() => vi.advanceTimersByTime(1000))
    expect(store.getState().view.transactionsPage.topDate).toBe('2026-07-21')
  })

  it('drops a pending top date when the views are reset before unmount', () => {
    vi.useFakeTimers()
    const { store, Wrapper } = makeWrapper()
    const { result, unmount } = renderHook(() => useTransactionsPageView(), {
      wrapper: Wrapper,
    })

    act(() => result.current.onTopDateChange('2026-07-21'))
    act(() => {
      store.dispatch(resetViews())
    })
    unmount()
    act(() => vi.advanceTimersByTime(1000))

    expect(store.getState().view.transactionsPage.topDate).toBeNull()
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
    })
  })
})
