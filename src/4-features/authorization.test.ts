import { configureStore } from '@reduxjs/toolkit'
import { describe, expect, it, vi } from 'vitest'
import token from 'store/token'
import view, { patchTransactionsPage } from 'store/view'

const { clearLocalDataMock } = vi.hoisted(() => ({
  clearLocalDataMock: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('./localData', () => ({
  clearLocalData: () => async () => clearLocalDataMock(),
  saveDataLocally: vi.fn(),
}))

import { logOut } from './authorization'

describe('logOut', () => {
  it('clears transient views', async () => {
    const store = configureStore({ reducer: { token, view } })
    store.dispatch(
      patchTransactionsPage({ search: 'view from the previous account' })
    )

    await (store.dispatch as any)(logOut())

    expect(store.getState().view.transactionsPage).toEqual({
      query: { clauses: [] },
      search: '',
      topDate: null,
    })
    expect(clearLocalDataMock).toHaveBeenCalledOnce()
  })
})
