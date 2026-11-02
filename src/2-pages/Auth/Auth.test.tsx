import '@testing-library/jest-dom/vitest'
import { configureStore } from '@reduxjs/toolkit'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { zenmoney } from '@/6-shared/api/zenmoney'
import { i18n } from '@/6-shared/localization'
import { TooltipProvider } from '@/6-shared/ui/kit/Tooltip'
import { rootReducer } from '@/store/rootReducer'
import Auth from './index'

vi.mock('./CurrencyBackground/CurrencyBackground', () => ({
  CurrencyBackground: () => null,
}))

beforeEach(async () => {
  await i18n.changeLanguage('ru-RU')
  vi.spyOn(zenmoney, 'authorize').mockResolvedValue(null)
  let mode: 'light' | 'dark' = 'light'
  const listeners = new Set<() => void>()
  window.themeManager = {
    getTheme: () => mode,
    toggle: () => {
      mode = mode === 'light' ? 'dark' : 'light'
      listeners.forEach(listener => listener())
    },
    subscribe: listener => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  delete window.themeManager
  localStorage.removeItem('language')
})

function renderLanding() {
  render(
    <Provider store={configureStore({ reducer: rootReducer })}>
      <MemoryRouter>
        <TooltipProvider>
          <Auth />
        </TooltipProvider>
      </MemoryRouter>
    </Provider>
  )
  return userEvent.setup()
}

it('signs in through the server for the currently selected language', async () => {
  const user = renderLanding()
  await user.click(
    screen.getByRole('button', { name: 'Войти через Дзен-мани' })
  )
  expect(zenmoney.authorize).toHaveBeenLastCalledWith('ru')

  const english = screen.getByRole('button', { name: 'Switch to English' })
  expect(english).toHaveTextContent('EN')
  await user.click(english)
  expect(localStorage.getItem('language')).toBe('en')
  await user.click(
    screen.getByRole('button', { name: 'Sign in with Zenmoney' })
  )
  expect(zenmoney.authorize).toHaveBeenLastCalledWith('app')

  const russian = screen.getByRole('button', { name: 'Переключить на русский' })
  expect(russian).toHaveTextContent('RU')
  await user.click(russian)
  expect(localStorage.getItem('language')).toBe('ru')
  await user.click(
    screen.getByRole('button', { name: 'Войти через Дзен-мани' })
  )
  expect(zenmoney.authorize).toHaveBeenLastCalledWith('ru')
  expect(zenmoney.authorize).toHaveBeenCalledTimes(3)
})

it('offers the opposite theme and toggles the shared theme manager', async () => {
  const user = renderLanding()
  await user.click(screen.getByRole('button', { name: 'Тёмная тема' }))
  expect(window.themeManager!.getTheme()).toBe('dark')
  await user.click(screen.getByRole('button', { name: 'Светлая тема' }))
  expect(window.themeManager!.getTheme()).toBe('light')
  expect(screen.getByRole('button', { name: 'Тёмная тема' })).toBeVisible()
})
