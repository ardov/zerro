import 'i18next'
import 'react-i18next'
import { resources, defaultNS } from '6-shared/localization'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS
    resources: (typeof resources)['ru']
  }
}
