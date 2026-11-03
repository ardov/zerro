import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  localStorage.clear()
  vi.resetModules()
})

it.each(['read', 'write'])(
  'retains the Zenmoney endpoint if storage fails after a successful %s',
  async operation => {
    const { zmPreferenceStorage } = await import('./zmPreferenceStorage')
    if (operation === 'write') zmPreferenceStorage.set('app')
    else {
      localStorage.setItem('zm_server', 'app')
      expect(zmPreferenceStorage.get()).toBe('app')
    }

    vi.stubGlobal('localStorage', null)

    expect(zmPreferenceStorage.get()).toBe('app')
  }
)

it('keeps failed writes and removals ahead of stale readable values', async () => {
  localStorage.setItem('token', 'old-token')
  localStorage.setItem('server', 'ru')
  const browserStorage = localStorage
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => browserStorage.getItem(key),
    setItem: () => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError')
    },
    removeItem: () => {
      throw new DOMException('Storage blocked', 'SecurityError')
    },
  })
  const { safeLocalStorage: storage } = await import('./browserStorage')

  storage.setItem('server', 'app')
  expect(storage.getItem('server')).toBe('app')
  storage.removeItem('token')
  expect(storage.getItem('token')).toBeNull()
  expect(localStorage.getItem('token')).toBe('old-token')
})

it('clears fallback credentials and stale browser values even when clear fails', async () => {
  localStorage.setItem('token', 'old-token')
  const { safeLocalStorage: storage } = await import('./browserStorage')
  const browserStorage = localStorage
  vi.stubGlobal('localStorage', null)
  storage.setItem('token', 'new-token')
  expect(storage.getItem('token')).toBe('new-token')
  storage.clear()
  vi.stubGlobal('localStorage', browserStorage)
  expect(storage.getItem('token')).toBeNull()
  storage.setItem('server', 'app')
  expect(storage.getItem('server')).toBe('app')
  storage.removeItem('server')
  expect(storage.getItem('server')).toBeNull()
})

it('observes external changes when browser persistence works', async () => {
  const { safeLocalStorage: storage } = await import('./browserStorage')
  storage.setItem('language', 'ru')
  expect(localStorage.getItem('language')).toBe('ru')
  localStorage.setItem('language', 'en')
  expect(storage.getItem('language')).toBe('en')
  storage.removeItem('language')
  expect(localStorage.getItem('language')).toBeNull()
  vi.stubGlobal('localStorage', null)
  expect(storage.getItem('language')).toBeNull()
})

it('does not restore cached values after external deletion or a successful clear', async () => {
  const { safeLocalStorage: storage } = await import('./browserStorage')
  storage.setItem('language', 'ru')
  localStorage.removeItem('language')
  expect(storage.getItem('language')).toBeNull()
  storage.setItem('token', 'test-token')
  storage.clear()
  vi.stubGlobal('localStorage', null)
  expect(storage.getItem('language')).toBeNull()
  expect(storage.getItem('token')).toBeNull()
})
