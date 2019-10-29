import React from 'react'
import { BrowserRouter, Route, Redirect, Switch } from 'react-router-dom'
import { connect } from 'react-redux'
import { IntlProvider, addLocaleData } from 'react-intl'
import ru from 'react-intl/locale-data/ru'
import Transactions from 'scenes/Transactions'
import Tags from 'scenes/Tags'
import Auth from 'scenes/Auth'
import Budgets from 'scenes/Budgets'
import { getLoginState } from 'store/token'
import RegularSyncHandler from 'components/RegularSyncHandler'
import CssBaseline from '@material-ui/core/CssBaseline'
import SnackbarHandler from 'components/SnackbarHandler'
import Nav from 'components/Navigation'
import { Box } from '@material-ui/core'
import { ThemeProvider } from '@material-ui/styles'
import createTheme from 'helpers/createTheme'
import { getTheme } from 'store/theme'
import { MuiPickersUtilsProvider } from '@material-ui/pickers'
import DateFnsUtils from '@date-io/date-fns'
import ruDateLocale from 'date-fns/locale/ru'

addLocaleData(ru)

const App = ({ isLoggedIn, themeType }) => (
  <ThemeProvider theme={createTheme(themeType)}>
    <>
      <CssBaseline />
      <IntlProvider locale="ru">
        <MuiPickersUtilsProvider utils={DateFnsUtils} locale={ruDateLocale}>
          <BrowserRouter>
            {isLoggedIn ? <PrivateApp /> : <Auth />}
          </BrowserRouter>
        </MuiPickersUtilsProvider>
      </IntlProvider>
    </>
  </ThemeProvider>
)

export default connect(
  state => ({ isLoggedIn: getLoginState(state), themeType: getTheme(state) }),
  null
)(App)

const PrivateApp = () => (
  <Box display="flex">
    <Nav />
    <SnackbarHandler />
    <RegularSyncHandler />
    <Box height="100vh" overflow="auto" flexGrow={1}>
      <Switch>
        <Route path="/transactions" component={Transactions} />
        <Route path="/tags" component={Tags} />
        <Route path="/budget" component={Budgets} />
        <Redirect to="/transactions" />
      </Switch>
    </Box>
  </Box>
)
