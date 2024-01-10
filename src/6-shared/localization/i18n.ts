import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ru from './ru.json'
import { en } from './en'
import { isProduction } from '6-shared/config'

export const resources = { ru, en }
export const defaultNS = 'common'
export const languges = Object.keys(resources)

i18n.use(initReactI18next).init({
  resources,
  defaultNS,
  // lng: 'dev',
  lng: 'ru',
  debug: isProduction,
  fallbackLng: ['en', 'ru', 'dev'],
  interpolation: {
    escapeValue: false,
  },
})

i18n.on('missingKey', function (lngs, namespace, key, res) {
  console.warn(`Missing translation: ${lngs[0]}, ${namespace}, ${key}`)
})

export { i18n }
