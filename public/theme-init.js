/*
  Applies the colour scheme before first paint and exposes window.themeManager.

  The absence of a stored preference means "follow the system". An explicit
  light or dark value overrides it until a toggle lands back on the system
  scheme. Storage failures fall back to memory for the current page.
*/

;(() => {
  const STORAGE_KEY = 'zerro-color-scheme'
  const LEGACY_KEYS = ['mui-mode', 'theme']
  const fallback = new Map()

  const storage = {
    get(key) {
      try {
        return localStorage.getItem(key) ?? fallback.get(key) ?? null
      } catch {
        return fallback.get(key) ?? null
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, value)
        fallback.delete(key)
      } catch {
        fallback.set(key, value)
      }
    },
    clear(key) {
      try {
        localStorage.removeItem(key)
      } catch {}
      fallback.delete(key)
    },
  }

  const parsePreference = value => {
    if (value === 'light' || value === 'dark' || value === 'system') {
      return value
    }

    try {
      const parsed = JSON.parse(value)
      return parsed === 'light' || parsed === 'dark' || parsed === 'system'
        ? parsed
        : null
    } catch {
      return null
    }
  }

  const migratePreference = () => {
    const current = parsePreference(storage.get(STORAGE_KEY))

    if (current === 'system') {
      storage.clear(STORAGE_KEY)
    } else if (current === 'light' || current === 'dark') {
      LEGACY_KEYS.forEach(key => storage.clear(key))
      return
    } else {
      for (const key of LEGACY_KEYS) {
        const legacy = parsePreference(storage.get(key))
        if (legacy === 'light' || legacy === 'dark') {
          storage.set(STORAGE_KEY, legacy)
          break
        }
        if (legacy === 'system') break
      }
    }

    // Without this cleanup, returning to the system scheme could resurrect an
    // old preference on a later page load.
    LEGACY_KEYS.forEach(key => storage.clear(key))
  }

  migratePreference()

  const listeners = new Set()
  const query = matchMedia('(prefers-color-scheme: dark)')
  const getSystemTheme = () => (query.matches ? 'dark' : 'light')

  const getTheme = () => {
    const preference = storage.get(STORAGE_KEY)
    return preference === 'light' || preference === 'dark'
      ? preference
      : getSystemTheme()
  }

  const apply = () => {
    const theme = getTheme()
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
    listeners.forEach(listener => listener())
  }

  window.themeManager = {
    getTheme,

    toggle() {
      const target = getTheme() === 'dark' ? 'light' : 'dark'
      if (target === getSystemTheme()) storage.clear(STORAGE_KEY)
      else storage.set(STORAGE_KEY, target)
      apply()
    },

    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }

  query.addEventListener('change', apply)
  addEventListener('storage', event => {
    if (event.key === null || event.key === STORAGE_KEY) apply()
  })

  apply()
})()
