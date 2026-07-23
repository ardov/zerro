import { configureStore } from '@reduxjs/toolkit'
import { act, renderHook } from '@testing-library/react'
import type { FC, PropsWithChildren } from 'react'
import { Provider } from 'react-redux'
import { describe, expect, it } from 'vitest'
import view from 'store/view'

import { useTransactionsPageView } from './useTransactionsPageView'

function makeWrapper() {
  const store = configureStore({ reducer: { view } })
  const Wrapper: FC<PropsWithChildren> = ({ children }) => (
    <Provider store={store}>{children}</Provider>
  )
  return { store, Wrapper }
}

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
