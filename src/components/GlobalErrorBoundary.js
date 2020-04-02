/* eslint-disable jsx-a11y/accessible-emoji */
import React from 'react'
import sendEvent from 'helpers/sendEvent'
import Cookies from 'cookies-js'
import storage from 'services/storage'
import * as Sentry from '@sentry/browser'

const buttonStyle = {
  border: '1px solid #ccc',
  padding: 16,
}
const wrapperStyle = {
  margin: '0 auto',
  padding: 40,
}

export default class GlobalErrorBoundary extends React.Component {
  state = { hasError: false }

  static getDerivedStateFromError = error => ({ hasError: true })

  componentDidCatch = (error, errorInfo) => {
    sendEvent(`GlobalError: ${error.message}`)
    if (process.env.NODE_ENV === 'production') {
      Sentry.withScope(scope => {
        scope.setExtras(errorInfo)
        Sentry.captureException(error)
      })
    }
  }

  fullRefresh = () => {
    storage.clear()
    Cookies.expire('token')
    window.location.reload(true)
  }

  render() {
    return this.state.hasError ? (
      <div style={wrapperStyle}>
        <h3>Всё поломалось 💩</h3>
        <button style={buttonStyle} onClick={this.fullRefresh}>
          🔧 Починить
        </button>
      </div>
    ) : (
      this.props.children
    )
  }
}
