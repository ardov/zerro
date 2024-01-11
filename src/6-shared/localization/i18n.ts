import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ru from './ru.json'
import { en } from './en'
import { isProduction } from '6-shared/config'

const LOCAL_STORAGE_KEY = 'language'
export const resources = { ru, en }
export const defaultNS = 'common'
export const languges = Object.keys(resources) as (keyof typeof resources)[]

function detectBestLanguage(languges: string[]) {
  const getLangOnly = (lang: string) => lang.split(/-|_/)[0]

  // Try with cached language
  const cachedLanguage = getLangOnly(
    localStorage.getItem(LOCAL_STORAGE_KEY) || ''
  )
  if (languges.includes(cachedLanguage)) return cachedLanguage

  // Try with browser language list
  const prefered = navigator.languages
    .map(getLangOnly)
    .find(lang => languges.includes(lang))
  if (prefered) return prefered

  // Try with navigator language
  const navigatorLanguage = getLangOnly(navigator.language)
  if (languges.includes(navigatorLanguage)) return navigatorLanguage

  // Return first language
  return languges[0]
}

i18n.use(initReactI18next).init({
  resources,
  defaultNS,
  // lng: 'dev',
  lng: detectBestLanguage(languges),
  debug: isProduction,
  fallbackLng: ['en', 'ru', 'dev'],
  interpolation: {
    escapeValue: false,
  },
})

// Cache language on change
i18n.on('languageChanged', function (lng) {
  localStorage.setItem(LOCAL_STORAGE_KEY, i18n.resolvedLanguage || lng)
})

i18n.on('missingKey', function (lngs, namespace, key, res) {
  console.warn(`Missing translation: ${lngs[0]}, ${namespace}, ${key}`)
})

export { i18n }
