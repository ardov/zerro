import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { runInNewContext } from 'node:vm'
import { describe, expect, it, vi } from 'vitest'

const source = readFileSync(resolve('public/theme-init.js'), 'utf8')

type Theme = 'light' | 'dark'
type ThemeManager = {
  getTheme: () => Theme
  toggle: () => void
  subscribe: (listener: () => void) => () => void
}

function runThemeManager(options?: {
  prefersDark?: boolean
  stored?: Record<string, string>
  storageThrows?: boolean
}) {
  const values = new Map(Object.entries(options?.stored ?? {}))
  const classes = new Set<string>()
  const mediaListeners = new Set<() => void>()
  const storageListeners = new Set<(event: { key: string | null }) => void>()
  const root = {
    classList: {
      contains: (name: string) => classes.has(name),
      toggle: (name: string, force: boolean) => {
        if (force) classes.add(name)
        else classes.delete(name)
      },
    },
    style: { colorScheme: '' },
  }
  const query = {
    matches: options?.prefersDark ?? false,
    addEventListener: (_event: string, listener: () => void) => {
      mediaListeners.add(listener)
    },
  }
  const localStorage = {
    getItem(key: string) {
      if (options?.storageThrows) throw new Error('storage blocked')
      return values.get(key) ?? null
    },
    setItem(key: string, value: string) {
      if (options?.storageThrows) throw new Error('storage blocked')
      values.set(key, value)
    },
    removeItem(key: string) {
      if (options?.storageThrows) throw new Error('storage blocked')
      values.delete(key)
    },
  }
  const window: { themeManager?: ThemeManager } = {}

  runInNewContext(source, {
    Map,
    Set,
    JSON,
    window,
    document: { documentElement: root },
    localStorage,
    matchMedia: () => query,
    addEventListener: (
      event: string,
      listener: (event: { key: string | null }) => void
    ) => {
      if (event === 'storage') storageListeners.add(listener)
    },
  })

  if (!window.themeManager) throw new Error('theme manager was not installed')

  return {
    manager: window.themeManager,
    values,
    root,
    setSystemTheme(theme: Theme) {
      query.matches = theme === 'dark'
      mediaListeners.forEach(listener => listener())
    },
    dispatchStorage(key: string | null) {
      storageListeners.forEach(listener => listener({ key }))
    },
  }
}

describe('theme-init', () => {
  it('applies the resolved system scheme during script execution', () => {
    const page = runThemeManager({ prefersDark: true })

    expect(page.root.classList.contains('dark')).toBe(true)
    expect(page.root.style.colorScheme).toBe('dark')
  })

  it('keeps explicit choices and returns to the system default reversibly', () => {
    const page = runThemeManager({
      prefersDark: true,
      stored: { 'zerro-color-scheme': 'light' },
    })

    expect(page.manager.getTheme()).toBe('light')
    page.manager.toggle()

    expect(page.manager.getTheme()).toBe('dark')
    expect(page.values.has('zerro-color-scheme')).toBe(false)
  })

  it('applies storage changes from another tab and notifies subscribers', () => {
    const page = runThemeManager()
    const listener = vi.fn()
    page.manager.subscribe(listener)

    page.values.set('zerro-color-scheme', 'dark')
    page.dispatchStorage('zerro-color-scheme')

    expect(page.root.classList.contains('dark')).toBe(true)
    expect(page.root.style.colorScheme).toBe('dark')
    expect(listener).toHaveBeenCalledOnce()
  })

  it('keeps working in memory when localStorage is blocked', () => {
    const page = runThemeManager({ storageThrows: true })

    expect(() => page.manager.toggle()).not.toThrow()
    expect(page.manager.getTheme()).toBe('dark')
    expect(page.root.classList.contains('dark')).toBe(true)
  })

  it('migrates JSON-quoted legacy values and removes stale keys', () => {
    const page = runThemeManager({ stored: { theme: '"dark"' } })

    expect(page.values.get('zerro-color-scheme')).toBe('dark')
    expect(page.values.has('theme')).toBe(false)
  })

  it('does not resurrect a legacy choice after returning to system', () => {
    const page = runThemeManager({
      stored: { 'zerro-color-scheme': 'system', 'mui-mode': 'dark' },
    })

    expect(page.manager.getTheme()).toBe('light')
    expect(page.values.has('zerro-color-scheme')).toBe(false)
    expect(page.values.has('mui-mode')).toBe(false)
  })
})
