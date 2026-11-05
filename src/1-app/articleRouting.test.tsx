import '@testing-library/jest-dom/vitest'
import { configureStore } from '@reduxjs/toolkit'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { afterEach, expect, it, vi } from 'vitest'
import { i18n } from '@/6-shared/localization'
import { rootReducer } from '@/store/rootReducer'
import App from './App'

vi.mock('@/3-widgets/RegularSyncHandler', () => ({
  RegularSyncHandler: () => null,
}))

vi.mock('@/2-pages/Auth/CurrencyBackground/CurrencyBackground', () => ({
  CurrencyBackground: () => null,
}))

afterEach(() => {
  cleanup()
  history.replaceState(null, '', '/')
})

function openPage(path: string) {
  history.replaceState(null, '', path)
  render(
    <Provider store={configureStore({ reducer: rootReducer })}>
      <App />
    </Provider>
  )
}

it('keeps an article and its links in the URL language, independently of the app preference', async () => {
  await i18n.changeLanguage('ru')
  openPage('/en/about/method?source=shared')
  expect(
    await screen.findByRole('heading', { name: 'Approach to Budgets' })
  ).toBeVisible()
  const next = document.querySelector('article a[href="/en/about/quick-start"]')
  expect(next).toBeVisible()
  await userEvent.click(screen.getByRole('link', { name: 'Русский' }))
  expect(
    await screen.findByRole('heading', { name: /Подход к\s+бюджетам/ })
  ).toBeVisible()
  expect(location.pathname).toBe('/about/method')
  expect(i18n.resolvedLanguage).toBe('ru')
})

it.each([
  ['/about/missing', 'ru', 'Вернуться в приложение'],
  ['/en/about/method/extra', 'en', 'Return to the app'],
  ['/unknown', 'en', 'Return to the app'],
])('shows the localized 404 at %s', async (path, language, label) => {
  await i18n.changeLanguage(language)
  openPage(path)
  expect(await screen.findByRole('heading', { name: '404' })).toBeVisible()
  expect(screen.getByRole('link', { name: label })).toHaveAttribute('href', '/')
  expect(location.pathname).toBe(path)
})
