import React from 'react'
import { ru as ruDateLocale } from 'date-fns/locale'
import { enUS as enDateLocale } from 'date-fns/locale'
import { i18n } from './i18n'

import { LocalizationProvider as DatePickerLocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { useTranslation } from 'react-i18next'

function getDateLocale(int: typeof i18n) {
  switch (int.language) {
    case 'ru':
      return ruDateLocale
    default:
      return enDateLocale
  }
}

export function LocalizationProvider(props: { children: React.ReactNode }) {
  const { i18n } = useTranslation()
  return (
    <DatePickerLocalizationProvider
      dateAdapter={AdapterDateFns}
      adapterLocale={getDateLocale(i18n)}
    >
      {props.children}
    </DatePickerLocalizationProvider>
  )
}
