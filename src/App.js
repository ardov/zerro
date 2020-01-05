import React from 'react'
import { Router, Route, Redirect, Switch } from 'react-router-dom'
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
import { Box, CircularProgress, Typography } from '@material-ui/core'
import { ThemeProvider } from '@material-ui/styles'
import createTheme from 'helpers/createTheme'
import { getTheme } from 'store/theme'
import { MuiPickersUtilsProvider } from '@material-ui/pickers'
import DateFnsUtils from '@date-io/date-fns'
import ruDateLocale from 'date-fns/locale/ru'
import { createBrowserHistory } from 'history'
import reactGA from 'react-ga'
import ErrorBoundary from 'components/ErrorBoundary'
import { getLastSyncTime } from 'store/serverData'

addLocaleData(ru)
reactGA.initialize('UA-72832368-2')

const history = createBrowserHistory()

history.listen(location => {
  reactGA.set({ page: location.pathname }) // Update the user's current page
  reactGA.pageview(location.pathname) // Record a pageview for the given page
})

const App = ({ isLoggedIn, themeType, hasData }) => (
  <ThemeProvider theme={createTheme(themeType)}>
    <>
      <CssBaseline />
      <ErrorBoundary>
        <IntlProvider locale="ru">
          <MuiPickersUtilsProvider utils={DateFnsUtils} locale={ruDateLocale}>
            <Router history={history}>
              {isLoggedIn ? <PrivateApp hasData={hasData} /> : <Auth />}
            </Router>
          </MuiPickersUtilsProvider>
        </IntlProvider>
      </ErrorBoundary>
    </>
  </ThemeProvider>
)

export default connect(
  state => ({
    isLoggedIn: getLoginState(state),
    themeType: getTheme(state),
    hasData: !!getLastSyncTime(state),
  }),
  null
)(App)

const PrivateApp = ({ hasData }) => (
  <Box display="flex">
    <Nav />
    <SnackbarHandler />
    <RegularSyncHandler />
    <Box height="100vh" overflow="auto" flexGrow={1}>
      <ErrorBoundary>
        {hasData ? (
          <Switch>
            <Route path="/transactions" component={Transactions} />
            <Route path="/tags" component={Tags} />
            <Route path="/budget" component={Budgets} />
            <Redirect to="/budget" />
          </Switch>
        ) : (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            height="100%"
          >
            <CircularProgress />
            {/* <Box mt={4}>
              <Typography align="center">
                Загружаю операции
              </Typography>
            </Box> */}
          </Box>
        )}
      </ErrorBoundary>
    </Box>
  </Box>
)
