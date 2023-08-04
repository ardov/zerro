import React from 'react'
import { Provider } from 'react-redux'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { StyledEngineProvider } from '@mui/material/styles'
import ruDateLocale from 'date-fns/locale/ru'
import { store } from 'store'
import { AppThemeProvider } from '6-shared/ui/theme'
import { SnackbarProvider } from '6-shared/ui/SnackbarProvider'

export function Providers(props: {
  children: React.ReactNode
  store?: typeof store
}) {
  return (
    <StyledEngineProvider injectFirst>
      <Provider store={props.store || store}>
        <LocalizationProvider
          dateAdapter={AdapterDateFns}
          adapterLocale={ruDateLocale}
        >
          <AppThemeProvider>
            <SnackbarProvider>{props.children}</SnackbarProvider>
          </AppThemeProvider>
        </LocalizationProvider>
      </Provider>
    </StyledEngineProvider>
  )
}
