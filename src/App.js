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
import { ThemeProvider } from '@material-ui/styles'
import { createMuiTheme } from '@material-ui/core/styles'

addLocaleData(ru)

const donorTheme = createMuiTheme({
  palette: { primary: { main: '#21a355' } },
})

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#212121',
    },
    secondary: {
      main: '#fff',
    },
    success: donorTheme.palette.primary,
  },
  shape: { borderRadius: 6 },
})
console.log('THEME', theme)

const App = ({ isLoggedIn }) => (
  <ThemeProvider theme={theme}>
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
  </ThemeProvider>
)

export default connect(
  state => ({ isLoggedIn: getLoginState(state) }),
  null
)(App)
