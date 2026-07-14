import type { History } from 'history'
import { appVersion, gaid, isProduction } from '6-shared/config'
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

export function initAnalytics(history: History): () => void {
  if (!isProduction || !gaid) return () => undefined

  if (!tagInitialized) {
    tagInitialized = true
    window.dataLayer = window.dataLayer || []
    window.gtag = (...args) => window.dataLayer?.push(args)

    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaid)}`
    document.head.appendChild(script)

    window.gtag('js', new Date())
    window.gtag('config', gaid, { send_page_view: false })
    window.gtag('set', { app_version: appVersion })
  }

  pageView(history.location.pathname)
  return history.listen(location => pageView(location.pathname))
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

function pageView(pathname: string): void {
  safelySend(() =>
    window.gtag?.('event', 'page_view', {
      page_location: `${window.location.origin}${pathname}`,
      page_path: pathname,
    })
  )
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
