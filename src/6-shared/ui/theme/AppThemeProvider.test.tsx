import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppThemeProvider } from './AppThemeProvider'

afterEach(() => {
  cleanup()
  delete window.themeManager
  document.documentElement.classList.remove('dark')
  document.documentElement.style.colorScheme = ''
})

describe('AppThemeProvider', () => {
  it('uses one manager subscription for its colour metadata', () => {
    const subscribe = vi.fn(() => () => {})
    window.themeManager = {
      getTheme: () => 'light',
      toggle: vi.fn(),
      subscribe,
    }

    render(<AppThemeProvider>content</AppThemeProvider>)

    expect(subscribe).toHaveBeenCalledOnce()
    expect(document.querySelector('meta[name="theme-color"]')).not.toBeNull()
  })

  it('updates an isolated scheme without toggling the stored preference', () => {
    const toggle = vi.fn()
    window.themeManager = {
      getTheme: () => 'light',
      toggle,
      subscribe: () => () => {},
    }
    const view = render(
      <AppThemeProvider defaultMode="dark">content</AppThemeProvider>
    )

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.style.colorScheme).toBe('dark')

    view.rerender(
      <AppThemeProvider defaultMode="light">content</AppThemeProvider>
    )

    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.style.colorScheme).toBe('light')
    expect(toggle).not.toHaveBeenCalled()
  })
})
