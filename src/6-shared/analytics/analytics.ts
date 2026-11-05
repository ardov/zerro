import { appVersion, gaid, isProduction } from '@/6-shared/config'
import { resolvePage } from '@/6-shared/pageRoutes'
import { reportablePath, reportableReferrer } from './pageUrls'
import type { AnalyticsEventMap, AnalyticsEventName } from './events'

type Gtag = (
  command: 'config' | 'event' | 'js' | 'set',
  targetOrName: string | Date | Record<string, unknown>,
  parameters?: Record<string, unknown>
) => void

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: Gtag
  }
}

let tagInitialized = false

type PageContext = { page_location: string; page_referrer: string }

function configurePage(context: PageContext, notFound: boolean): void {
  if (tagInitialized) {
    window.gtag?.('config', gaid, {
      update: true,
      send_page_view: false,
      ...context,
    })
    return
  }
  window.dataLayer ??= []
  window.gtag ??= function () {
    // Google's command queue expects an arguments object.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer?.push(arguments)
  }

  const script = document.createElement('script')
  script.async = true
  script.referrerPolicy = 'origin'
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaid)}`
  document.head.appendChild(script)

  window.gtag('js', new Date())
  // Preserve campaign attribution on regular landings. A missing URL may contain private data.
  window.gtag('config', gaid, {
    send_page_view: false,
    ...(notFound && context),
  })
  window.gtag('set', { app_version: appVersion })
  tagInitialized = true
}

export function trackPageView(
  pathname: string,
  referrer = document.referrer
): void {
  if (!isProduction || !gaid) return
  const notFound = !resolvePage(pathname)
  const path = notFound ? reportablePath(pathname) : pathname
  const context = {
    page_location: location.origin + path,
    page_referrer: reportableReferrer(referrer),
  }
  safelySend(() => {
    configurePage(context, notFound)
    window.gtag?.('event', 'page_view', {
      ...context,
      page_path: path,
      ...(notFound && { page_title: '404 · Zerro' }),
      send_to: gaid,
    })
  })
}

export function track<K extends AnalyticsEventName>(
  name: K,
  properties: AnalyticsEventMap[K]
): void {
  if (!isProduction) {
    console.log('[analytics]', name, properties)
    return
  }
  safelySend(() => window.gtag?.('event', name, clean(properties)))
}

export function setAnalyticsUser(userId: number | null): void {
  if (!isProduction) return
  safelySend(() => window.gtag?.('set', { user_id: userId || null }))
}

function clean(properties: object): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined)
  )
}

function safelySend(send: () => void): void {
  try {
    send()
  } catch (error) {
    console.warn('[analytics] provider failed', error)
  }
}
