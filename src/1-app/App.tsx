import React, {
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import { RadialProgress } from '@/6-shared/ui/kit/RadialProgress'
import { useTranslation } from 'react-i18next'
import { setAnalyticsUser, trackPageView } from '@/6-shared/analytics'
import { OverlayHost } from '@/6-shared/overlays'
import { useAppSelector } from '@/store'
import { getLoginState } from '@/store/token'
import { getLastSyncTime } from '@/store/data/selectors'
import { core } from '@/zerro-core/redux'

import { HistoryShortcuts } from '@/4-features/historyShortcuts'
import { RegularSyncHandler } from '@/3-widgets/RegularSyncHandler'
import { Layout } from './Layout'
import { HistoryTopBar } from '@/3-widgets/History/HistoryTopBar'
import { pageColumns } from '@/1-app/pageColumns'
import { Columns } from '@/6-shared/ui/layout/Columns'
import { PanelScrollable } from '@/6-shared/ui/layout/Panel'
import { CanvasPage } from '@/6-shared/ui/layout/CanvasPage'
import ErrorBoundary from '@/3-widgets/ErrorBoundary'
import Transactions from '@/2-pages/Transactions'
import Auth from '@/2-pages/Auth'
import { NotFound } from '@/2-pages/NotFound'
import Budgets from '@/2-pages/Budgets'
import Accounts from '@/2-pages/Accounts'
import { articleRoutes, resolvePage, type AppPath } from '@/6-shared/pageRoutes'
import { PageHead } from '@/2-pages/About/Head'
import { GlobalWidgets } from './GlobalWidgets'

const About = lazy(() => import('@/2-pages/About'))
const Donation = lazy(() => import('@/2-pages/Donation'))
const Token = lazy(() => import('@/2-pages/Token'))
const Stats = lazy(() => import('@/2-pages/Stats'))
const Review = lazy(() => import('@/2-pages/Review'))

const defaultPage = <Navigate to="/transactions" replace />
const signedInPages = {
  '/': defaultPage,
  '/login': defaultPage,
  '/transactions': <Transactions />,
  '/accounts': <AccountsPage />,
  '/budget': <Budgets />,
  '/review': (
    <CanvasRoute>
      <Review />
    </CanvasRoute>
  ),
  '/stats': (
    <CanvasRoute>
      <Stats />
    </CanvasRoute>
  ),
  '/token': (
    <CanvasRoute>
      <Token />
    </CanvasRoute>
  ),
} satisfies Record<Exclude<AppPath, '/donation'>, React.ReactNode>

export default function App() {
  return (
    <BrowserRouter>
      <Application />
    </BrowserRouter>
  )
}

function Application() {
  const isLoggedIn = useAppSelector(getLoginState)
  const hasData = useAppSelector(state => !!getLastSyncTime(state))
  const navigation = isLoggedIn && hasData
  const userId = core.users.useRootId()
  useEffect(() => {
    setAnalyticsUser(userId || null)
  }, [userId])

  const auth = (
    <CanvasRoute>
      <Auth />
    </CanvasRoute>
  )

  return (
    <>
      <PageMetadata signedIn={isLoggedIn} />
      <AnalyticsNavigation />
      <OverlayHost>
        <RegularSyncHandler />
        {navigation && <HistoryShortcuts />}
        <RouteLayout
          navigation={navigation}
          toolbar={navigation ? <HistoryTopBar /> : undefined}
        >
          <ErrorBoundary>
            <Suspense fallback={<FallbackLoader />}>
              <Routes>
                {articleRoutes.map(article => (
                  <Route
                    key={article.path}
                    path={article.path}
                    caseSensitive
                    element={
                      <CanvasRoute>
                        <About {...article} />
                      </CanvasRoute>
                    }
                  />
                ))}
                <Route
                  path="/donation"
                  caseSensitive
                  element={
                    <CanvasRoute>
                      <Donation />
                    </CanvasRoute>
                  }
                />
                {Object.entries(signedInPages).map(([path, page]) => {
                  let element = page
                  if (!isLoggedIn) element = auth
                  else if (!hasData && path !== '/token')
                    element = <MainLoader />
                  return (
                    <Route
                      key={path}
                      path={path}
                      caseSensitive
                      element={element}
                    />
                  )
                })}
                <Route
                  path="*"
                  element={
                    <>
                      <title>404 · Zerro</title>
                      <meta name="robots" content="noindex" />
                      <NotFound homeLink={<Link to="/" />} />
                    </>
                  }
                />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </RouteLayout>
        <GlobalWidgets />
      </OverlayHost>
    </>
  )
}

function PageMetadata({ signedIn }: { signedIn: boolean }) {
  const { pathname } = useLocation()
  const { i18n } = useTranslation()
  const page = resolvePage(pathname)
  const article = page?.article
  const language = article?.language ?? i18n.resolvedLanguage ?? i18n.language
  useLayoutEffect(() => {
    document.documentElement.lang = language
  }, [language, i18n.resolvedLanguage])
  return (
    <PageHead
      article={article}
      includeTitleAndDescription={
        !!article || (!!page && !signedIn && page.path !== '/donation')
      }
    />
  )
}

function AnalyticsNavigation() {
  const { pathname } = useLocation()

  const previousPath = useRef<string | null>(null)
  useEffect(() => {
    if (previousPath.current === pathname) return
    const referrer =
      previousPath.current === null
        ? document.referrer
        : location.origin + previousPath.current
    trackPageView(pathname, referrer)
    previousPath.current = pathname
  }, [pathname])

  return null
}

/** The route picks the page's columns. Reading the location here rather than
 * in `Application` keeps a screen opening from rebuilding every route. */
function RouteLayout(
  props: Omit<React.ComponentProps<typeof Layout>, 'columns'>
) {
  const { pathname } = useLocation()
  const columns = pathname.startsWith('/transactions')
    ? pageColumns.transactions
    : pathname.startsWith('/budget')
      ? pageColumns.budget
      : pathname.startsWith('/accounts')
        ? pageColumns.accounts
        : undefined
  return <Layout {...props} columns={columns} />
}

function AccountsPage() {
  return (
    <Columns>
      <PanelScrollable>
        <Accounts />
      </PanelScrollable>
    </Columns>
  )
}

function CanvasRoute({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  return <CanvasPage key={pathname}>{children}</CanvasPage>
}

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
