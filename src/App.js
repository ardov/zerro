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

import { ThemeProvider } from '@material-ui/styles'

import createTheme from 'helpers/createTheme'
import { getTheme } from 'store/theme'

addLocaleData(ru)

const App = ({ isLoggedIn, themeType }) => (
  <ThemeProvider theme={createTheme(themeType)}>
    <>
      <CssBaseline />
      <SnackbarHandler>
        <RegularSyncHandler>
          <IntlProvider locale="ru">
            <BrowserRouter>
              <Switch>
                <Route
                  path="/transactions"
                  render={() => (isLoggedIn ? <Transactions /> : <Auth />)}
                />
                <Route
                  path="/tags"
                  render={() => (isLoggedIn ? <Tags /> : <Auth />)}
                />
                <Route
                  path="/budget"
                  render={() => (isLoggedIn ? <Budgets /> : <Auth />)}
                />
                <Route
                  path="/login"
                  render={() =>
                    isLoggedIn ? <Redirect to="/transactions" /> : <Auth />
                  }
                />
                <Redirect to="/transactions" />
              </Switch>
            </BrowserRouter>
          </IntlProvider>
        </RegularSyncHandler>
      </SnackbarHandler>
    </>
  </ThemeProvider>
)

export default connect(
  state => ({ isLoggedIn: getLoginState(state), themeType: getTheme(state) }),
  null
)(App)
