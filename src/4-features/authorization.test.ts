import { configureStore } from '@reduxjs/toolkit'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import token from '@/store/token'
import view, { patchTransactionsPage } from '@/store/view'

const { clearLocalDataMock, authorizeMock, refreshMock } = vi.hoisted(() => ({
  clearLocalDataMock: vi.fn().mockResolvedValue(undefined),
  authorizeMock: vi.fn(),
  refreshMock: vi.fn(),
}))

vi.mock('./localData', () => ({
  clearLocalData: () => async () => clearLocalDataMock(),
}))

vi.mock('@/6-shared/api/zenmoney', () => ({
  zenmoney: { authorize: authorizeMock },
}))
vi.mock('@/4-features/sync', () => ({
  refreshData: () => refreshMock,
}))

beforeEach(() => {
  vi.clearAllMocks()
})

import { logIn, logOut } from './authorization'

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

describe('logIn', () => {
  it.each(['ru', 'app'] as const)(
    'starts %s authorization synchronously and clears data only after success',
    async endpoint => {
      let completeAuth!: (token: string) => void
      authorizeMock.mockReturnValue(
        new Promise<string>(resolve => {
          completeAuth = resolve
        })
      )
      let finishCleanup!: () => void
      clearLocalDataMock.mockReturnValueOnce(
        new Promise<void>(resolve => {
          finishCleanup = resolve
        })
      )
      const store = configureStore({ reducer: { token, view } })
      const pending = (store.dispatch as any)(logIn(endpoint))
      expect(authorizeMock).toHaveBeenCalledWith(endpoint)
      expect(clearLocalDataMock).not.toHaveBeenCalled()
      completeAuth('test-token')
      await vi.waitFor(() => expect(clearLocalDataMock).toHaveBeenCalledOnce())
      expect(store.getState().token).not.toBe('test-token')
      expect(refreshMock).not.toHaveBeenCalled()
      finishCleanup()
      await pending
      expect(store.getState().token).toBe('test-token')
      expect(refreshMock).toHaveBeenCalledOnce()
    }
  )

  it('does not clear local data when authorization is blocked or cancelled', async () => {
    authorizeMock.mockResolvedValue(null)
    const store = configureStore({ reducer: { token, view } })
    await (store.dispatch as any)(logIn('ru'))
    expect(clearLocalDataMock).not.toHaveBeenCalled()
    expect(refreshMock).not.toHaveBeenCalled()
  })
})
