import * as Sentry from '@sentry/browser'
import type { ErrorInfo } from 'react'
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
