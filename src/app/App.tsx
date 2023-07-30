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
import { initTracking, setUserId } from '@shared/helpers/tracking'
import { PopoverManager } from '@shared/historyPopovers'
import { useAppSelector } from '@store'
import { getLoginState } from '@store/token'
import { getLastSyncTime } from '@store/data/selectors'
import { RegularSyncHandler } from 'widgets/RegularSyncHandler'
import Nav from 'widgets/Navigation'
import { MobileNavigation } from 'widgets/Navigation'
import ErrorBoundary from 'widgets/ErrorBoundary'
import { userModel } from '@entities/user'
import Transactions from '@pages/Transactions'
import Auth from '@pages/Auth'
import Budgets from '@pages/Budgets'
import Accounts from '@pages/Accounts'
import { SmartConfirm } from '@shared/ui/SmartConfirm'
import { SmartTransactionListDrawer } from 'widgets/transaction/TransactionListDrawer'
import { SmartTransactionPreview } from 'widgets/transaction/TransactionPreviewDrawer'

const About = lazy(() => import('@pages/About'))
const Donation = lazy(() => import('@pages/Donation'))
const Token = lazy(() => import('@pages/Token'))
const Stats = lazy(() => import('@pages/Stats'))
const Review = lazy(() => import('@pages/Review'))

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

  return (
    <Router history={history}>
      <PopoverManager>
        <RegularSyncHandler />
        <Layout isLoggedIn={isLoggedIn}>
          <ErrorBoundary>
            <Suspense
              fallback={
                <Box
                  sx={{
                    display: 'grid',
                    placeContent: 'center',
                    height: '100%',
                  }}
                >
                  <CircularProgress />
                </Box>
              }
            >
              <Switch>
                {isLoggedIn
                  ? hasData
                    ? loggedInWithData
                    : loggedInNoData
                  : notLoggedIn}
              </Switch>
            </Suspense>
          </ErrorBoundary>
        </Layout>

        <SmartConfirm />
        <SmartTransactionListDrawer />
        <SmartTransactionPreview />
      </PopoverManager>
    </Router>
  )
}

type TLayoutProps = {
  isLoggedIn: boolean
  children: React.ReactNode
}

const Layout: FC<TLayoutProps> = ({ isLoggedIn, children }) => {
  return (
    <Box display="flex">
      {isLoggedIn && <Navigation />}
      <Box minHeight="100vh" flexGrow={1}>
        {children}
      </Box>
    </Box>
  )
}

const Navigation = React.memo(() => {
  const isMobile = useMediaQuery<Theme>(theme => theme.breakpoints.down('md'))
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
