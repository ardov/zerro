import type { FC } from 'react'
import React, { lazy, Suspense, useEffect, useState } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import { RadialProgress } from '@/6-shared/ui/kit/RadialProgress'
import { useTranslation } from 'react-i18next'
import {
  initAnalytics,
  setAnalyticsUser,
  trackPageView,
} from '@/6-shared/analytics'
import { OverlayHost } from '@/6-shared/overlays'
import { useAppSelector } from '@/store'
import { getLoginState } from '@/store/token'
import { getLastSyncTime } from '@/store/data/selectors'
import { core } from '@/zerro-core/redux'

import { HistoryShortcuts } from '@/4-features/historyShortcuts'
import { RegularSyncHandler } from '@/3-widgets/RegularSyncHandler'
import { HistoryTopBar } from '@/3-widgets/History/HistoryTopBar'
import {
  MobileNavigation,
  Rail,
  useBottomBarHeight,
  useBottomBarShown,
} from '@/3-widgets/Navigation'
import { panelWidths } from '@/6-shared/ui/layout/panelWidths'
import { Panel, scrollInsetClass } from '@/6-shared/ui/layout/Panel'
import { cn } from '@/6-shared/ui/shadcn/utils'
import ErrorBoundary from '@/3-widgets/ErrorBoundary'
import Transactions from '@/2-pages/Transactions'
import Auth from '@/2-pages/Auth'
import Budgets from '@/2-pages/Budgets'
import Accounts from '@/2-pages/Accounts'
import { GlobalWidgets } from './GlobalWidgets'

const About = lazy(() => import('@/2-pages/About'))
const Donation = lazy(() => import('@/2-pages/Donation'))
const Token = lazy(() => import('@/2-pages/Token'))
const Stats = lazy(() => import('@/2-pages/Stats'))
const Review = lazy(() => import('@/2-pages/Review'))

export default function App() {
  const isLoggedIn = useAppSelector(getLoginState)
  const hasData = useAppSelector(state => !!getLastSyncTime(state))
  const userId = core.users.useRootId()
  useEffect(() => {
    setAnalyticsUser(userId || null)
  }, [userId])

  const publicRoutes = (wrap: (page: React.ReactNode) => React.ReactNode) => [
    <Route key="about" path="/about/*" element={wrap(<About />)} />,
    <Route key="donation" path="/donation" element={wrap(<Donation />)} />,
  ]

  const notLoggedIn = [
    ...publicRoutes(page => page),
    <Route key="*" path="*" element={<Auth />} />,
  ]

  const loggedInNoData = [
    ...publicRoutes(inPanel),
    <Route key="token" path="/token" element={inPanel(<Token />)} />,
    <Route key="*" path="*" element={<MainLoader />} />,
  ]

  const loggedInWithData = [
    ...publicRoutes(inPanel),
    <Route key="token" path="/token" element={inPanel(<Token />)} />,
    <Route
      key="transactions"
      path="/transactions"
      element={<Transactions />}
    />,
    <Route key="review" path="/review" element={onCanvas(<Review />)} />,
    <Route key="accounts" path="/accounts" element={inPanel(<Accounts />)} />,
    <Route key="budget" path="/budget" element={<Budgets />} />,
    <Route key="stats" path="/stats" element={onCanvas(<Stats />)} />,
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
      <OverlayHost>
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
      </OverlayHost>
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
  const bottomBar = useBottomBarShown()
  const bottomBarHeight = useBottomBarHeight()
  if (!isLoggedIn) return <div className="min-h-screen">{children}</div>

  const canvas = {
    // The canvas padding and the gap between panels: none under the bottom
    // bar, where panels run edge to edge.
    '--canvas-gap': `${bottomBar ? 0 : panelWidths.gap}px`,
    // How much of the window the bottom bar covers; each page scroller adds
    // it inside its scroll (see `scrollInsetClass`).
    '--bottom-inset': `${bottomBar ? bottomBarHeight : 0}px`,
  } as React.CSSProperties

  return (
    <div className="flex h-dvh bg-background" style={canvas}>
      {!bottomBar && <Rail />}
      <div className="flex min-w-0 grow flex-col">
        {hasData && <HistoryTopBar />}
        <main className="flex min-h-0 grow gap-(--canvas-gap) p-(--canvas-gap)">
          {children}
        </main>
      </div>
      {bottomBar && <MobileNavigation />}
    </div>
  )
}

/** A page not laid out in panels yet: one panel holds all of it. */
const inPanel = (page: React.ReactNode) => (
  <Panel className="min-w-0 grow">{page}</Panel>
)

/** A page made of its own cards, laid straight on the canvas. */
const onCanvas = (page: React.ReactNode) => (
  <div className={cn('min-h-0 min-w-0 grow overflow-auto', scrollInsetClass)}>
    {page}
  </div>
)

function FallbackLoader() {
  const { t } = useTranslation('loadingHints')
  return (
    <div className="grid grow place-content-center">
      <RadialProgress size={40} aria-label={t('hint')} />
    </div>
  )
}

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
    <div className="flex grow flex-col items-center justify-center">
      <RadialProgress size={40} aria-label={t('hint')} />
      <div className="mt-8 w-[200px]">
        <p className="m-0 text-center text-body">{hint}</p>
      </div>
    </div>
  )
}
