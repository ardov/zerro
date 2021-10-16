import React, { useEffect, useState } from 'react'
import { Router, Route, Redirect, Switch } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Transactions from 'scenes/Transactions'
import Auth from 'scenes/Auth'
import Budgets from 'scenes/Budgets'
import Review from 'scenes/Review'
import { getLoginState } from 'store/token'
import { RegularSyncHandler } from 'components/RegularSyncHandler'
import Nav from 'components/Navigation'
import { MobileNavigation } from 'components/Navigation'
import { Box, CircularProgress, Typography, useMediaQuery } from '@mui/material'
import { createBrowserHistory } from 'history'
import ErrorBoundary from 'components/ErrorBoundary'
import { getLastSyncTime, getRootUserId } from 'store/data/selectors'
import Accounts from 'scenes/Accounts'
import Stats from 'scenes/Stats'
import About from 'scenes/About'
import Token from 'scenes/Token'
import Donation from 'scenes/Donation'
import { initTracking, setUserId } from 'helpers/tracking'

const history = createBrowserHistory()
initTracking(history)

export default function App() {
  const isLoggedIn = useSelector(getLoginState)
  const userId = useSelector(getRootUserId)
  useEffect(() => {
    setUserId(userId)
  }, [userId])

  return (
    <ErrorBoundary>
      <RegularSyncHandler />
      <Router history={history}>
        <Switch>
          <Route path="/about" component={About} />
          <Route path="/about/*" component={About} />
          <Route path="/*" component={isLoggedIn ? PrivateApp : Auth} />
        </Switch>
      </Router>
    </ErrorBoundary>
  )
}

const PrivateApp = () => {
  const hasData = useSelector(state => !!getLastSyncTime(state))
  return (
    <Box display="flex">
      <Navigation />
      <Box minHeight="100vh" flexGrow={1}>
        <ErrorBoundary>
          {hasData ? (
            <Switch>
              <Route path="/transactions" component={Transactions} />
              <Route path="/review" component={Review} />
              <Route path="/accounts" component={Accounts} />
              <Route path="/budget" component={Budgets} />
              <Route path="/stats" component={Stats} />
              <Route path="/token" component={Token} />
              <Route path="/donation" component={Donation} />
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

const Navigation = React.memo(() => {
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('md'))
  return isMobile ? <MobileNavigation /> : <Nav />
})

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
