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
  it('preserves the page theme color across mounting and unmounting', ({
    onTestFinished,
  }) => {
    const meta = document.createElement('meta')
    meta.name = 'theme-color'
    meta.content = '#111212'
    document.head.append(meta)
    onTestFinished(() => meta.remove())

    const colors = () =>
      Array.from(
        document.head.querySelectorAll<HTMLMetaElement>(
          'meta[name="theme-color"]'
        ),
        tag => tag.content
      )
    const view = render(<AppThemeProvider>content</AppThemeProvider>)
    expect(colors()).toEqual(['#111212'])
    view.unmount()
    expect(colors()).toEqual(['#111212'])
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
