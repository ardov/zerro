import { configureStore } from '@reduxjs/toolkit'
import { act, renderHook } from '@testing-library/react'
import type { FC, PropsWithChildren } from 'react'
import { Provider } from 'react-redux'
import { describe, expect, it } from 'vitest'

import type { AppThunk } from '.'
import { useAppCommand } from '.'
import view, { patchTransactionsPage } from './view'

const setSearch =
  (search: string): AppThunk<string> =>
  dispatch => {
    dispatch(patchTransactionsPage({ search }))
    return search
  }

function makeWrapper() {
  const store = configureStore({ reducer: { view } })
  const Wrapper: FC<PropsWithChildren> = ({ children }) => (
    <Provider store={store}>{children}</Provider>
  )
  return { store, Wrapper }
}

describe('useAppCommand', () => {
  it('dispatches a semantic thunk, returns its receipt, and stays stable', () => {
    const { store, Wrapper } = makeWrapper()
    const { result, rerender } = renderHook(() => useAppCommand(setSearch), {
      wrapper: Wrapper,
    })
    const firstCommand = result.current
    let receipt: string | undefined

    act(() => {
      receipt = result.current('coffee')
    })
    rerender()

    expect(receipt).toBe('coffee')
    expect(store.getState().view.transactionsPage.search).toBe('coffee')
    expect(result.current).toBe(firstCommand)
  })
})
