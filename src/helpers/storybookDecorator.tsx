import React from 'react'
import { ThemeProvider } from '@material-ui/styles'
import { Box, BoxProps } from '@material-ui/core'
import AdapterDateFns from '@material-ui/lab/AdapterDateFns'
import LocalizationProvider from '@material-ui/lab/LocalizationProvider'
import ruDateLocale from 'date-fns/locale/ru'
import { Provider } from 'react-redux'
import { store } from 'store'

import { createTheme } from 'helpers/createTheme'

const decorator = (boxProps: BoxProps) => (story: any) => (
  <Provider store={store}>
    <ThemeProvider theme={createTheme()}>
      <LocalizationProvider dateAdapter={AdapterDateFns} locale={ruDateLocale}>
        <Box m={4} {...boxProps}>
          {story()}
        </Box>
      </LocalizationProvider>
    </ThemeProvider>
  </Provider>
)

export default decorator
