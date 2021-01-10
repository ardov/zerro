import React from 'react'
import { ThemeProvider } from '@material-ui/styles'
import { Box, BoxProps } from '@material-ui/core'
import { MuiPickersUtilsProvider } from '@material-ui/pickers'
import DateFnsUtils from '@date-io/date-fns'
import ru from 'date-fns/locale/ru'
import { Provider } from 'react-redux'
import { store } from 'store'

import { createTheme } from 'helpers/createTheme'

const decorator = (boxProps: BoxProps) => (story: any) => (
  <Provider store={store}>
    <ThemeProvider theme={createTheme()}>
      <MuiPickersUtilsProvider utils={DateFnsUtils} locale={ru}>
        <Box m={4} {...boxProps}>
          {story()}
        </Box>
      </MuiPickersUtilsProvider>
    </ThemeProvider>
  </Provider>
)

export default decorator
