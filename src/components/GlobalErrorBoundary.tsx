/* eslint-disable jsx-a11y/accessible-emoji */
import React from 'react'
import { captureError, sendEvent } from 'helpers/tracking'
import Cookies from 'cookies-js'
import { clearStorage } from 'worker'

const buttonStyle = { border: '1px solid #ccc', padding: 16 }
const wrapperStyle = { margin: '0 auto', padding: 40 }

export default class GlobalErrorBoundary extends React.Component {
  state = { hasError: false }

  static getDerivedStateFromError = (error: any) => ({ hasError: true })

  componentDidCatch = (error: Error, errorInfo: React.ErrorInfo) => {
    sendEvent(`GlobalError: ${error.message}`)
    captureError(error, errorInfo)
  }

  fullRefresh = () => {
    clearStorage()
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
