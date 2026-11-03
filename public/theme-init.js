/*
  Applies the colour scheme before first paint and exposes window.themeManager.

  The absence of a stored preference means "follow the system". An explicit
  light or dark value overrides it until a toggle lands back on the system
  scheme. Storage failures fall back to memory for the current page.
*/

;(() => {
  const STORAGE_KEY = 'theme'
  let preference = null
  let unsaved = false

  const readPreference = () => {
    if (!unsaved) {
      try {
        preference = localStorage.getItem(STORAGE_KEY)
      } catch {}
    }
    return preference
  }

  const writePreference = value => {
    preference = value
    unsaved = true
    try {
      if (value === null) localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, value)
      unsaved = false
    } catch {}
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

  const listeners = new Set()
  const query = matchMedia('(prefers-color-scheme: dark)')
  const getSystemTheme = () => (query.matches ? 'dark' : 'light')

  const getTheme = () => {
    const preference = parsePreference(readPreference())
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
      writePreference(target === getSystemTheme() ? null : target)
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
