import React from 'react'
import { Provider } from 'react-redux'
import { store } from '../src/store'
import LocalizationProvider from '@material-ui/lab/LocalizationProvider'
import AdapterDateFns from '@material-ui/lab/AdapterDateFns'
import ruDateLocale from 'date-fns/locale/ru'
import { AppThemeProvider } from '../src/AppThemeProvider'

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
}

export const decorators = [
  Story => (
    <Provider store={store}>
      <LocalizationProvider dateAdapter={AdapterDateFns} locale={ruDateLocale}>
        <AppThemeProvider>
          <Story />
        </AppThemeProvider>
      </LocalizationProvider>
    </Provider>
  ),
]
