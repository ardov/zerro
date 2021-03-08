import React from 'react'
import { connect } from 'react-redux'
import { logOut } from 'logic/authorization'
import { captureError, sendEvent } from 'helpers/tracking'
import { ErrorMessage } from './ErrorMessage'
import { AppDispatch } from 'store'

interface ErrorBoundaryProps {
  logOut: () => void
}
interface ErrorBoundaryState {
  hasError: boolean
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state = { hasError: false }
  static getDerivedStateFromError = (error: Error) => ({ hasError: true })
  componentDidCatch = (error: Error, errorInfo: React.ErrorInfo) => {
    sendEvent(`Error: ${error.message}`)
    captureError(error, errorInfo)
  }
  render() {
    return this.state.hasError ? (
      <ErrorMessage onLogOut={this.props.logOut} />
    ) : (
      this.props.children
    )
  }
}

const mapDispatchToProps = (dispatch: AppDispatch) => ({
  logOut: () => dispatch(logOut()),
})

export default connect(null, mapDispatchToProps)(ErrorBoundary)
