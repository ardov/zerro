import reactGA from 'react-ga'
import * as Sentry from '@sentry/browser'
import { ErrorInfo } from 'react'
import { History } from 'history'

const {
  NODE_ENV,
  REACT_APP_SENTRY_DSN,
  REACT_APP_VERSION,
  REACT_APP_YMID,
  REACT_APP_GAID,
} = process.env

const isProduction = NODE_ENV === 'production'

export function initSentry() {
  if (isProduction && REACT_APP_SENTRY_DSN) {
    Sentry.init({ release: REACT_APP_VERSION, dsn: REACT_APP_SENTRY_DSN })
  }
}

export function captureError(error: Error, errorInfo?: ErrorInfo) {
  if (!isProduction) return
  if (!error) return

  if (errorInfo) {
    Sentry.withScope(scope => {
      // @ts-ignore
      scope.setExtras(errorInfo)
      Sentry.captureException(error)
    })
  } else {
    Sentry.captureException(error)
  }
}

export function initTracking(history: History) {
  if (isProduction && REACT_APP_GAID) {
    reactGA.initialize(REACT_APP_GAID)
    history.listen(location => {
      reactGA.set({ page: location.pathname }) // Update the user's current page
      reactGA.pageview(location.pathname) // Record a pageview for the given page
    })
  }
}

export function setUserId(userId: number) {
  if (isProduction && userId) {
    reactGA.set({ userId })
  }
}

export function sendEvent(event: string) {
  if (event && isProduction) {
    // @ts-ignore
    if (window.ym && REACT_APP_YMID) {
      // @ts-ignore
      window.ym(REACT_APP_YMID, 'reachGoal', event)
    }

    const eventArr = event.split(': ')
    reactGA.event({
      category: eventArr[0],
      action: eventArr[1] || '-',
      label: eventArr[2] || '',
    })
  } else console.log('📫', event)
}
