import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { afterEach, expect, it, vi } from 'vitest'
import { makeStoryStore } from 'stories/fixtures/storyStore'
import { setToken } from '@/store/token'
import { safeLocalStorage } from '@/6-shared/api/browserStorage'
import { setStartPage } from '@/6-shared/startPage'
import App from './App'

vi.mock('@/3-widgets/RegularSyncHandler', () => ({
  RegularSyncHandler: () => null,
}))
vi.mock('@/2-pages/Transactions', () => ({
  default: () => <h1>Transactions</h1>,
}))
vi.mock('@/2-pages/Budgets', () => ({ default: () => <h1>Budgets</h1> }))
vi.mock('@/2-pages/Accounts', () => ({ default: () => <h1>Accounts</h1> }))
vi.mock('@/2-pages/Auth', () => ({ default: () => <h1>Sign in</h1> }))

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  safeLocalStorage.removeItem('startPage')
  history.replaceState(null, '', '/')
})

function openPage(path: string, signedIn = true) {
  history.replaceState(null, '', path)
  const store = makeStoryStore()
  if (signedIn) store.dispatch(setToken('test-token'))
  render(
    <Provider store={store}>
      <App />
    </Provider>
  )
}

it.each([
  [null, '/transactions', 'Transactions'],
  ['/transactions', '/transactions', 'Transactions'],
  ['/budget', '/budget', 'Budgets'],
  ['/unknown', '/transactions', 'Transactions'],
])('launches the PWA with saved start page %s', async (saved, path, title) => {
  if (saved !== null) safeLocalStorage.setItem('startPage', saved)
  const replace = vi.spyOn(history, 'replaceState')
  openPage('/?source=pwa')
  expect(await screen.findByRole('heading', { name: title })).toBeVisible()
  expect(location.pathname).toBe(path)
  expect(replace).toHaveBeenLastCalledWith(expect.anything(), '', path)
  replace.mockRestore()
})

it.each(['/', '/login'])(
  'opens the saved start page from %s after signing in',
  async path => {
    setStartPage('/budget')
    openPage(path)
    expect(
      await screen.findByRole('heading', { name: 'Budgets' })
    ).toBeVisible()
    expect(location.pathname).toBe('/budget')
  }
)

it.each([
  ['/transactions?source=pwa', 'Transactions'],
  ['/accounts?source=pwa', 'Accounts'],
])('keeps the explicit destination %s', async (path, title) => {
  setStartPage('/budget')
  openPage(path)
  expect(await screen.findByRole('heading', { name: title })).toBeVisible()
  expect(location.pathname + location.search).toBe(path)
})

it('requires sign-in before opening the saved start page', async () => {
  setStartPage('/budget')
  openPage('/?source=pwa', false)
  expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeVisible()
  expect(location.pathname).toBe('/')
})

it('still opens when browser storage is unavailable', async () => {
  safeLocalStorage.removeItem('startPage')
  vi.stubGlobal('localStorage', null)
  openPage('/?source=pwa')
  await waitFor(() => expect(location.pathname).toBe('/transactions'))
})
