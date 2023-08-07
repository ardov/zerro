import React, { FC, lazy, Suspense, useEffect, useState } from 'react'
import { Router, Route, Redirect, Switch } from 'react-router-dom'
import { createBrowserHistory } from 'history'
import {
  Box,
  CircularProgress,
  Typography,
  useMediaQuery,
  Theme,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { initTracking, setUserId } from '6-shared/helpers/tracking'
import { PopoverManager } from '6-shared/historyPopovers'
import { useAppSelector } from 'store'
import { getLoginState } from 'store/token'
import { getLastSyncTime } from 'store/data/selectors'
import { userModel } from '5-entities/user'
import { RegularSyncHandler } from '3-widgets/RegularSyncHandler'
import Nav from '3-widgets/Navigation'
import { MobileNavigation } from '3-widgets/Navigation'
import ErrorBoundary from '3-widgets/ErrorBoundary'
import Transactions from '2-pages/Transactions'
import Auth from '2-pages/Auth'
import Budgets from '2-pages/Budgets'
import Accounts from '2-pages/Accounts'
import { GlobalWidgets } from './GlobalWidgets'

const About = lazy(() => import('2-pages/About'))
const Donation = lazy(() => import('2-pages/Donation'))
const Token = lazy(() => import('2-pages/Token'))
const Stats = lazy(() => import('2-pages/Stats'))
const Review = lazy(() => import('2-pages/Review'))

const history = createBrowserHistory()
initTracking(history)

export default function App() {
  const isLoggedIn = useAppSelector(getLoginState)
  const hasData = useAppSelector(state => !!getLastSyncTime(state))
  const userId = userModel.useRootUserId()
  useEffect(() => {
    if (userId) setUserId(userId)
  }, [userId])

  const publicRoutes = [
    <Route key="about" path="/about" component={About} />,
    <Route key="about/*" path="/about/*" component={About} />,
    <Route key="donation" path="/donation" component={Donation} />,
  ]

  const notLoggedIn = [
    ...publicRoutes,
    <Route key="*" path="/*" component={Auth} />,
  ]

  const loggedInNoData = [
    ...publicRoutes,
    <Route key="token" path="/token" component={Token} />,
    <Route key="*" path="*" component={MainLoader} />,
  ]

  const loggedInWithData = [
    ...publicRoutes,
    <Route key="token" path="/token" component={Token} />,
    <Route key="transactions" path="/transactions" component={Transactions} />,
    <Route key="review" path="/review" component={Review} />,
    <Route key="accounts" path="/accounts" component={Accounts} />,
    <Route key="budget" path="/budget" component={Budgets} />,
    <Route key="stats" path="/stats" component={Stats} />,
    <Route key="*" path="*" render={() => <Redirect to="/budget" />} />,
  ]

  const getRoutes = () => {
    if (!isLoggedIn) return notLoggedIn
    if (!hasData) return loggedInNoData
    return loggedInWithData
  }

  const routes = getRoutes()

  return (
    <Router history={history}>
      <PopoverManager>
        <RegularSyncHandler />
        <Layout isLoggedIn={isLoggedIn}>
          <ErrorBoundary>
            <Suspense fallback={<FallbackLoader />}>
              <Switch>{routes}</Switch>
            </Suspense>
          </ErrorBoundary>
        </Layout>
        <GlobalWidgets />
      </PopoverManager>
    </Router>
  )
}

const Layout: FC<{
  isLoggedIn: boolean
  children: React.ReactNode
}> = props => {
  const { isLoggedIn, children } = props
  return (
    <Box display="flex">
      {isLoggedIn && <Navigation />}
      <Box minHeight="100vh" flexGrow={1}>
        {children}
      </Box>
    </Box>
  )
}

const FallbackLoader = () => (
  <Box sx={{ display: 'grid', placeContent: 'center', height: '100%' }}>
    <CircularProgress />
  </Box>
)

const Navigation = React.memo(() => {
  const isMobile = useMediaQuery<Theme>(theme => theme.breakpoints.down('md'))
  return isMobile ? <MobileNavigation /> : <Nav />
})

function MainLoader() {
  const [hint, setHint] = useState('')
  const { t } = useTranslation('loadingHints')

  useEffect(() => {
    const hints = [
      { hint: t('hint'), delay: 0 },
      { hint: t('hint_1', 'hint'), delay: 5000 },
      { hint: t('hint_2', 'hint'), delay: 10000 },
      { hint: t('hint_3', 'hint'), delay: 30000 },
      { hint: t('hint_4', 'hint'), delay: 45000 },
    ]
    const timers = hints.map(({ hint, delay }) =>
      setTimeout(() => setHint(hint), delay)
    )
    return () => {
      timers.forEach(timer => clearTimeout(timer))
    }
  }, [t])
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
