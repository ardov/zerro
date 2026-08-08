import type { FC } from 'react'
import React, { lazy, Suspense, useEffect, useState } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import type { Theme } from '@mui/material'
import { Box, CircularProgress, Typography, useMediaQuery } from '@mui/material'
import { useTranslation } from 'react-i18next'
import {
  initAnalytics,
  setAnalyticsUser,
  trackPageView,
} from '6-shared/analytics'
import { PopoverManager } from '6-shared/historyPopovers'
import { useAppSelector } from 'store'
import { getLoginState } from 'store/token'
import { getLastSyncTime } from 'store/data/selectors'
import { core } from 'zerro-core/redux'

import { HistoryShortcuts } from '4-features/historyShortcuts'
import { RegularSyncHandler } from '3-widgets/RegularSyncHandler'
import { HistoryTopBar } from '3-widgets/History/HistoryTopBar'
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

export default function App() {
  const isLoggedIn = useAppSelector(getLoginState)
  const hasData = useAppSelector(state => !!getLastSyncTime(state))
  const userId = core.users.useRootId()
  useEffect(() => {
    setAnalyticsUser(userId || null)
  }, [userId])

  const publicRoutes = [
    <Route key="about" path="/about/*" element={<About />} />,
    <Route key="donation" path="/donation" element={<Donation />} />,
  ]

  const notLoggedIn = [
    ...publicRoutes,
    <Route key="*" path="*" element={<Auth />} />,
  ]

  const loggedInNoData = [
    ...publicRoutes,
    <Route key="token" path="/token" element={<Token />} />,
    <Route key="*" path="*" element={<MainLoader />} />,
  ]

  const loggedInWithData = [
    ...publicRoutes,
    <Route key="token" path="/token" element={<Token />} />,
    <Route
      key="transactions"
      path="/transactions"
      element={<Transactions />}
    />,
    <Route key="review" path="/review" element={<Review />} />,
    <Route key="accounts" path="/accounts" element={<Accounts />} />,
    <Route key="budget" path="/budget" element={<Budgets />} />,
    <Route key="stats" path="/stats" element={<Stats />} />,
    <Route key="*" path="*" element={<Navigate to="/budget" replace />} />,
  ]

  const getRoutes = () => {
    if (!isLoggedIn) return notLoggedIn
    if (!hasData) return loggedInNoData
    return loggedInWithData
  }

  const routes = getRoutes()

  return (
    <BrowserRouter>
      <AnalyticsNavigation />
      <PopoverManager>
        <RegularSyncHandler />
        {isLoggedIn && hasData && <HistoryShortcuts />}
        <Layout isLoggedIn={isLoggedIn} hasData={hasData}>
          <ErrorBoundary>
            <Suspense fallback={<FallbackLoader />}>
              <Routes>{routes}</Routes>
            </Suspense>
          </ErrorBoundary>
        </Layout>
        <GlobalWidgets />
      </PopoverManager>
    </BrowserRouter>
  )
}

function AnalyticsNavigation() {
  const { pathname } = useLocation()

  useEffect(() => initAnalytics(), [])
  useEffect(() => trackPageView(pathname), [pathname])

  return null
}

const Layout: FC<{
  isLoggedIn: boolean
  hasData: boolean
  children: React.ReactNode
}> = props => {
  const { isLoggedIn, hasData, children } = props
  return (
    <Box sx={{ display: 'flex' }}>
      {isLoggedIn && <Navigation />}
      <Box
        sx={{
          minHeight: '100vh',
          flexGrow: 1,
          minWidth: 0,
        }}
      >
        {/* Inside the content column, not above the whole layout: the
            navigation drawer is fixed, and a full-width bar would hand it
            the controls on its left. */}
        {isLoggedIn && hasData && <HistoryTopBar />}
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
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
      }}
    >
      <CircularProgress />
      <Box sx={{ mt: 4, width: '200' }}>
        <Typography align="center">{hint}</Typography>
      </Box>
    </Box>
  )
}
