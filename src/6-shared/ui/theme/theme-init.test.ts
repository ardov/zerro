import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { runInNewContext } from 'node:vm'
import { describe, expect, it, vi } from 'vitest'
import { getThemeColor } from '../kit/themeColor'

const source = readFileSync(resolve('public/theme-init.js'), 'utf8')
const entry = new DOMParser().parseFromString(
  readFileSync(resolve('index.html'), 'utf8').split('</head>')[0],
  'text/html'
)
const manifest = JSON.parse(
  readFileSync(resolve('public/manifest.json'), 'utf8')
)

type Theme = 'light' | 'dark'

function runThemeManager(options?: {
  prefersDark?: boolean
  stored?: Record<string, string>
  storageThrows?: boolean
  storageWritesThrow?: boolean
}) {
  const values = new Map(Object.entries(options?.stored ?? {}))
  const page = entry.cloneNode(true) as Document
  const mediaListeners = new Set<() => void>()
  const storageListeners = new Set<(event: { key: string | null }) => void>()
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
      if (options?.storageThrows || options?.storageWritesThrow)
        throw new Error('storage blocked')
      values.set(key, value)
    },
    removeItem(key: string) {
      if (options?.storageThrows || options?.storageWritesThrow)
        throw new Error('storage blocked')
      values.delete(key)
    },
  }
  const window: Pick<Window, 'themeManager'> = {}

  runInNewContext(source, {
    Map,
    Set,
    JSON,
    window,
    document: page,
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
    root: page.documentElement,
    query,
    get themeColor() {
      const frames = page.head.querySelectorAll<HTMLMetaElement>(
        'meta[name="theme-color"]'
      )
      return [...frames].find(
        frame => matchMedia(frame.getAttribute('media') ?? '').matches
      )?.content
    },
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
  it('leaves the native launch frame to the browser and declares both page colors before boot', () => {
    const frames = entry.head.querySelectorAll<HTMLMetaElement>(
      'meta[name="theme-color"]'
    )
    const boot = entry.head.querySelector<HTMLScriptElement>(
      'meta[name="theme-color"] ~ script[src="/theme-init.js"]'
    )
    expect(manifest.theme_color).toBeUndefined()
    expect(
      [...frames].map(frame => [frame.getAttribute('media'), frame.content])
    ).toEqual([
      ['(prefers-color-scheme: dark)', getThemeColor('dark')],
      [null, getThemeColor('light')],
    ])
    expect(boot).toMatchObject({ async: false, defer: false })
    expect(['', 'text/javascript', 'application/javascript']).toContain(
      boot?.type
    )
  })

  it('keeps the reported theme and frame in sync from boot through a system change', () => {
    const page = runThemeManager({ prefersDark: true })

    expect(page.root.classList.contains('dark')).toBe(true)
    expect(page.root.style.colorScheme).toBe('dark')
    expect(page.themeColor).toBe(getThemeColor('dark'))
    page.query.matches = false
    expect(page.manager.getTheme()).toBe('dark')
    expect(page.themeColor).toBe(getThemeColor('dark'))

    page.setSystemTheme('light')
    expect(page.manager.getTheme()).toBe('light')
    expect(page.themeColor).toBe(getThemeColor('light'))
  })

  it('keeps explicit choices and returns to the system default reversibly', () => {
    const page = runThemeManager({
      prefersDark: true,
      stored: { theme: 'light' },
    })

    expect(page.manager.getTheme()).toBe('light')
    expect(page.themeColor).toBe(getThemeColor('light'))
    page.manager.toggle()

    expect(page.manager.getTheme()).toBe('dark')
    expect(page.themeColor).toBe(getThemeColor('dark'))
    expect(page.values.has('theme')).toBe(false)
  })

  it('applies storage changes from another tab and notifies subscribers', () => {
    const page = runThemeManager()
    const listener = vi.fn()
    page.manager.subscribe(listener)

    page.values.set('theme', 'dark')
    page.dispatchStorage('theme')

    expect(page.root.classList.contains('dark')).toBe(true)
    expect(page.root.style.colorScheme).toBe('dark')
    expect(listener).toHaveBeenCalledOnce()
    expect(page.themeColor).toBe(getThemeColor('dark'))
  })

  it('keeps working in memory when localStorage is blocked', () => {
    const page = runThemeManager({ storageThrows: true })

    expect(() => page.manager.toggle()).not.toThrow()
    expect(page.manager.getTheme()).toBe('dark')
    expect(page.root.classList.contains('dark')).toBe(true)
  })

  it('toggles past a stale preference when storage is read-only', () => {
    const page = runThemeManager({
      stored: { theme: 'dark' },
      storageWritesThrow: true,
    })

    page.manager.toggle()
    expect(page.manager.getTheme()).toBe('light')
    page.manager.toggle()
    expect(page.manager.getTheme()).toBe('dark')
    expect(page.values.get('theme')).toBe('dark')
  })

  it('accepts the JSON-quoted values written by the original theme setting', () => {
    const page = runThemeManager({ stored: { theme: '"dark"' } })

    expect(page.manager.getTheme()).toBe('dark')
    expect(page.root.classList.contains('dark')).toBe(true)
  })

  it('ignores invalid stored values and follows the system', () => {
    const page = runThemeManager({
      prefersDark: true,
      stored: { theme: 'invalid' },
    })

    expect(page.manager.getTheme()).toBe('dark')
  })
})
