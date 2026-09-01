import * as Sentry from '@sentry/browser'
import type { ErrorInfo } from 'react'
import { appVersion, isProduction, sentryDSN } from '@/6-shared/config'

export function initSentry() {
  if (isProduction && sentryDSN) {
    Sentry.init({ release: appVersion, dsn: sentryDSN })
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
