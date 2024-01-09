import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ru from './ru.json'

export const resources = { ru }
export const defaultNS = 'common'

i18n.use(initReactI18next).init({
  resources,
  defaultNS,
  // lng: 'dev',
  lng: 'ru',
  debug: true,
  interpolation: {
    escapeValue: false,
  },
})

i18n.on('missingKey', function (lngs, namespace, key, res) {
  console.warn(`Missing translation: ${lngs[0]}, ${namespace}, ${key}`)
})

export default i18n
