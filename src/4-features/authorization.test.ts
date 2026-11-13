import { configureStore } from '@reduxjs/toolkit'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import data from '@/store/data'
import token from '@/store/token'
import view, { patchTransactionsPage } from '@/store/view'
import displayCurrency, { setSavedCurrency } from '@/store/displayCurrency'
import { i18n } from '@/6-shared/localization'
import { tokenStorage } from '@/6-shared/api/tokenStorage'
import { convertDiff } from '@/6-shared/api/zm-adapter'

const { clearLocalDataMock, authorizeMock, refreshMock, demoLoads } =
  vi.hoisted(() => ({
    clearLocalDataMock: vi.fn().mockResolvedValue(undefined),
    authorizeMock: vi.fn(),
    refreshMock: vi.fn(),
    demoLoads: { count: 0 },
  }))

vi.mock('./localData', () => ({
  clearLocalData: () => async () => clearLocalDataMock(),
}))

vi.mock('@/6-shared/api/zenmoney', () => ({
  zenmoney: { authorize: authorizeMock, fakeToken: 'fake_token' },
}))
vi.mock('@/zerro-core/demo', async importOriginal => {
  demoLoads.count++
  return importOriginal()
})
vi.mock('@/4-features/sync', () => ({
  refreshData: () => refreshMock,
}))

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  tokenStorage.clear()
})

import { loadBackup, loadDemoData, logIn, logOut } from './authorization'

describe('logOut', () => {
  it('clears transient views', async () => {
    const store = configureStore({ reducer: { token, view } })
    store.dispatch(
      patchTransactionsPage({
        search: 'view from the previous account',
        checked: ['previous-transaction'],
        scrollOffset: 1477,
      })
    )

    await (store.dispatch as any)(logOut())

    expect(store.getState().view.transactionsPage).toEqual({
      query: { clauses: [] },
      search: '',
      topDate: null,
      scrollOffset: null,
      checked: [],
      summary: {},
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

describe('loadDemoData', () => {
  it('loads the demo module only when the demo is opened', async () => {
    expect(demoLoads.count).toBe(0)
    const store = configureStore({ reducer: { token, data } })

    await (store.dispatch as any)(loadDemoData())

    expect(demoLoads.count).toBe(1)
    expect(store.getState().token).toBe('fake_token')
    expect(
      Object.keys(store.getState().data.current.account).length
    ).toBeGreaterThan(0)
  })

  it.each([
    ['ru', 2, 'Revolut · Зарплатный'],
    ['ru-RU', 2, 'Revolut · Зарплатный'],
    ['en', 3, 'Revolut EUR'],
    ['en-US', 3, 'Revolut EUR'],
  ])(
    'opens the %s demo in its own currency',
    async (language, currency, account) => {
      await i18n.changeLanguage(language)
      const store = configureStore({
        reducer: { token, data, displayCurrency },
        preloadedState: { displayCurrency: 'USD' },
      })

      await (store.dispatch as any)(loadDemoData())

      expect(store.getState().data.current.user[23880].currency).toBe(currency)
      expect(store.getState().data.current.account[account].title).toBe(account)
      expect(store.getState().displayCurrency).toBeNull()
    }
  )

  it('keeps the real account currency through demo edits, reload and logout', async () => {
    const reducer = { token, data, view, displayCurrency }
    const store = configureStore({ reducer })
    store.dispatch(setSavedCurrency('USD') as any)
    await i18n.changeLanguage('ru')

    await (store.dispatch as any)(loadDemoData())
    expect(store.getState().displayCurrency).toBeNull()
    store.dispatch(setSavedCurrency('EUR') as any)

    const reloaded = configureStore({
      reducer,
      preloadedState: {
        token: tokenStorage.get(),
        data: store.getState().data,
      },
    })
    expect(reloaded.getState().displayCurrency).toBe('EUR')
    await (reloaded.dispatch as any)(logOut())
    expect(reloaded.getState().displayCurrency).toBe('USD')
    expect(configureStore({ reducer }).getState().displayCurrency).toBe('USD')
  })

  it('opens a single demo in the current language after overlapping clicks', async () => {
    const store = configureStore({ reducer: { token, data, displayCurrency } })
    void i18n.changeLanguage('en')
    const first = (store.dispatch as any)(loadDemoData())
    void i18n.changeLanguage('ru')
    const second = (store.dispatch as any)(loadDemoData())

    await Promise.all([first, second])

    const current = store.getState().data.current
    expect(current.user[23880].currency).toBe(2)
    expect(current.account['Revolut · Зарплатный']).toBeDefined()
    expect(Object.values(current.account)).toHaveLength(9)
    expect(Object.values(current.tag)).toHaveLength(20)
    expect(Object.values(current.merchant)).toHaveLength(18)
  })
})

describe('loadBackup', () => {
  it('retains the current currency instead of inheriting the last demo preference', async () => {
    const reducer = { token, data, view, displayCurrency }
    const store = configureStore({ reducer })
    store.dispatch(setSavedCurrency('USD') as any)
    await (store.dispatch as any)(loadDemoData())
    store.dispatch(setSavedCurrency('EUR') as any)
    await (store.dispatch as any)(logOut())

    const { makeDemoDiff } = await import('@/zerro-core/demo')
    const file = new File(
      [JSON.stringify(convertDiff.toServer(makeDemoDiff()))],
      'backup.json'
    )
    await (store.dispatch as any)(loadBackup(file))

    expect(store.getState().token).toBe('fake_token')
    expect(store.getState().displayCurrency).toBe('USD')
    expect(configureStore({ reducer }).getState().displayCurrency).toBe('USD')
  })
})
