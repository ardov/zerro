import * as Sentry from '@sentry/browser'
import type { ErrorInfo } from 'react'
import type { TDataStore } from '@/6-shared/types'
import { appRelease, isProduction, sentryDSN } from '@/6-shared/config'

export function initSentry() {
  if (isProduction && sentryDSN) {
    Sentry.init({
      release: appRelease,
      dsn: sentryDSN,
      // Preserve the restrictive v10 defaults when using Sentry 11.
      dataCollection: {
        userInfo: false,
        cookies: false,
        httpHeaders: {
          request: { deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] },
          response: { deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] },
        },
        httpBodies: [],
        urlQueryParams: {
          deny: ['forwarded', '-ip', 'remote-', 'via', '-user'],
        },
        genAI: { inputs: false, outputs: false },
        databaseQueryData: false,
        queues: false,
        graphQL: { document: false, variables: false },
      },
    })
  }
}

export function captureError(error: Error, errorInfo?: ErrorInfo) {
  if (!isProduction || !error) return

  if (errorInfo) {
    Sentry.withScope(scope => {
      // @ts-expect-error errorInfo doesn't match the Extras type
      scope.setExtras(errorInfo)
      Sentry.captureException(error)
    })
  } else {
    Sentry.captureException(error)
  }
}

const reportedMerchantUserWarnings = new Set<string>()

/** Report canonical ownership anomalies, without identifiers or row contents.
 * Each reason/source is sent at most once per page, including background pulls. */
export function captureMerchantUserWarnings(
  store: Pick<TDataStore, 'merchant' | 'user'>,
  source: 'local' | 'full-reload' | 'pull' | 'push'
) {
  if (!isProduction) return

  const merchants = Object.values(store.merchant)
  const counts = { missing: 0, null: 0, missing_reference: 0, invalid_type: 0 }
  merchants.forEach(merchant => {
    const user: unknown = merchant.user
    if (user === undefined) counts.missing++
    else if (user === null) counts.null++
    else if (typeof user !== 'number' && typeof user !== 'string')
      counts.invalid_type++
    else if (!Object.hasOwn(store.user, user)) counts.missing_reference++
  })
  Object.entries(counts).forEach(([reason, count]) => {
    if (!count) return
    const key = `${source}:${reason}`
    if (reportedMerchantUserWarnings.has(key)) return
    reportedMerchantUserWarnings.add(key)
    try {
      Sentry.captureMessage('Merchant user anomaly', {
        level: 'warning',
        fingerprint: ['merchant-user-anomaly', reason],
        tags: { entity: 'merchant', field: 'user', reason, source },
        extra: {
          count,
          merchantCount: merchants.length,
          userCount: Object.keys(store.user).length,
        },
      })
    } catch {
      // Telemetry must never turn a tolerated anomaly into a load/sync failure.
    }
  })
}
