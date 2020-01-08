import React from 'react'
import { connect } from 'react-redux'
import { logOut } from 'logic/authorization'
import sendEvent from 'helpers/sendEvent'
import ErrorMessage from './ErrorMessage'
import * as Sentry from '@sentry/browser'

class ErrorBoundary extends React.Component {
  state = { hasError: false }

  static getDerivedStateFromError = error => ({ hasError: true })

  componentDidCatch = (error, errorInfo) => {
    sendEvent(`Error: ${error.message}`)
    if (process.env.NODE_ENV === 'production') {
      Sentry.withScope(scope => {
        scope.setExtras(errorInfo)
        const eventId = Sentry.captureException(error)
        this.setState({ eventId })
      })
    }
  }

  render() {
    return this.state.hasError ? (
      <ErrorMessage onLogOut={this.props.logOut} />
    ) : (
      this.props.children
    )
  }
}

const mapDispatchToProps = dispatch => ({
  logOut: () => dispatch(logOut()),
})

export default connect(null, mapDispatchToProps)(ErrorBoundary)
