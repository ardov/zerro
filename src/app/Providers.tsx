import React from 'react'
import { Provider } from 'react-redux'
import AdapterDateFns from '@mui/lab/AdapterDateFns'
import LocalizationProvider from '@mui/lab/LocalizationProvider'
import { StyledEngineProvider } from '@mui/material/styles'
import ruDateLocale from 'date-fns/locale/ru'
import { store } from '@store'
import { AppThemeProvider } from './AppThemeProvider'
import { SnackbarProvider } from '@shared/ui/SnackbarProvider'

export function Providers(props: {
  children: React.ReactNode
  store?: typeof store
}) {
  return (
    <StyledEngineProvider injectFirst>
      <Provider store={props.store || store}>
        <LocalizationProvider
          dateAdapter={AdapterDateFns}
          locale={ruDateLocale}
        >
          <AppThemeProvider>
            <SnackbarProvider>{props.children}</SnackbarProvider>
          </AppThemeProvider>
        </LocalizationProvider>
      </Provider>
    </StyledEngineProvider>
  )
}
