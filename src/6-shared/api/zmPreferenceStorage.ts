import type { EndpointPreference } from '@/6-shared/api/zenmoney'
import { safeLocalStorage } from './browserStorage'

const STORAGE_KEY = 'zm_server'

export const zmPreferenceStorage = {
  get: (): EndpointPreference => {
    return safeLocalStorage.getItem(STORAGE_KEY) === 'app' ? 'app' : 'ru'
  },
  set: (preference: EndpointPreference) =>
    preference
      ? safeLocalStorage.setItem(STORAGE_KEY, preference)
      : safeLocalStorage.removeItem(STORAGE_KEY),
  clear: () => safeLocalStorage.removeItem(STORAGE_KEY),
}
