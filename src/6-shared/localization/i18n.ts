import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ru from './ru.json'

export const resources = { ru }
export const defaultNS = 'common'

i18n.use(initReactI18next).init({
  resources,
  defaultNS,
  lng: 'ru',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
