import type { EndpointPreference } from '6-shared/config'

const STORAGE_KEY = 'zm_server'

export const zmPreferenceStorage = {
  get: (): EndpointPreference => {
    return window.localStorage.getItem(STORAGE_KEY) === 'app' ? 'app' : 'ru'
  },
  set: (preference: EndpointPreference) =>
    preference
      ? localStorage.setItem(STORAGE_KEY, preference)
      : localStorage.removeItem(STORAGE_KEY),
  clear: () => localStorage.removeItem(STORAGE_KEY),
}
