import React, { useEffect, useState } from 'react'
import { Router, Route, Redirect, Switch } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Transactions from 'scenes/Transactions'
import Auth from 'scenes/Auth'
import Budgets from 'scenes/Budgets'
import { getLoginState } from 'store/token'
import RegularSyncHandler from 'components/RegularSyncHandler'
import CssBaseline from '@material-ui/core/CssBaseline'
import SnackbarHandler from 'components/SnackbarHandler'
import Nav from 'components/Navigation'
import MobileNav from 'components/MobileNav'
import {
  Box,
  CircularProgress,
  Typography,
  useMediaQuery,
} from '@material-ui/core'
import { ThemeProvider } from '@material-ui/styles'
import { createTheme } from 'helpers/createTheme'
import { getTheme } from 'store/theme'
import { Helmet } from 'react-helmet'

import { createBrowserHistory } from 'history'
import reactGA from 'react-ga'
import ErrorBoundary from 'components/ErrorBoundary'
import { getLastSyncTime, getRootUserId } from 'store/serverData'
import Accounts from 'scenes/Accounts'
import Stats from 'scenes/Stats'
import About from 'scenes/About'
import Token from 'scenes/Token'
import { Settings } from 'scenes/Settings'

const history = createBrowserHistory()

if (process.env.NODE_ENV === 'production') {
  reactGA.initialize('UA-72832368-2')
  history.listen(location => {
    reactGA.set({ page: location.pathname }) // Update the user's current page
    reactGA.pageview(location.pathname) // Record a pageview for the given page
  })
}

export default function App() {
  const isLoggedIn = useSelector(getLoginState)
  const themeType = useSelector(getTheme)
  const theme = createTheme(themeType)
  const userId = useSelector(getRootUserId)
  useEffect(() => {
    if (userId) reactGA.set({ userId })
  }, [userId])

  return (
    <ThemeProvider theme={theme}>
      <>
        <CssBaseline />
        <ErrorBoundary>
          <Helmet>
            <meta name="theme-color" content={theme.palette.background.paper} />
          </Helmet>
          <Router history={history}>
            <Switch>
              <Route path="/about" component={About} />
              <Route path="/about/*" component={About} />
              <Route path="/*" component={isLoggedIn ? PrivateApp : Auth} />
            </Switch>
          </Router>
        </ErrorBoundary>
      </>
    </ThemeProvider>
  )
}

const PrivateApp = () => {
  const hasData = useSelector(state => !!getLastSyncTime(state))
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('sm'))
  return (
    <Box display="flex">
      {isMobile ? <MobileNav /> : <Nav />}

      <SnackbarHandler />
      <RegularSyncHandler />
      <Box minHeight="100vh" flexGrow={1}>
        <ErrorBoundary>
          {hasData ? (
            <Switch>
              <Route path="/transactions" component={Transactions} />
              <Route path="/accounts" component={Accounts} />
              <Route path="/budget/:month" component={Budgets} />
              <Route path="/budget" component={Budgets} />
              <Route path="/stats" component={Stats} />
              <Route path="/settings" component={Settings} />
              <Route path="/token" component={Token} />
              <Redirect to="/budget" />
            </Switch>
          ) : (
            <MainLoader />
          )}
        </ErrorBoundary>
      </Box>
    </Box>
  )
}

const hints = [
  { hint: 'Первая загрузка самая долгая 😅', delay: 5000 },
  { hint: 'Всё зависит от интернета и количества операций 🤞', delay: 10000 },
  { hint: 'Может всё-таки загрузится? 🤔', delay: 30000 },
  { hint: 'Что-то долго, попробуйте перезагрузить страницу 🤪', delay: 45000 },
]

function MainLoader() {
  const [hint, setHint] = useState('Загружаемся... 🖤')

  useEffect(() => {
    const timers = hints.map(({ hint, delay }) =>
      setTimeout(() => setHint(hint), delay)
    )
    return () => {
      timers.forEach(timer => clearTimeout(timer))
    }
  }, [])
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100%"
    >
      <CircularProgress />
      <Box mt={4} width="200">
        <Typography align="center">{hint}</Typography>
      </Box>
    </Box>
  )
}
