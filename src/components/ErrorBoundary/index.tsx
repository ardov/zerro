import React, { ReactNode } from 'react'
import { connect } from 'react-redux'
import { logOut } from '@features/authorization'
import { captureError, sendEvent } from '@shared/helpers/tracking'
import { ErrorMessage } from './ErrorMessage'
import { AppDispatch } from '@store'

interface ErrorBoundaryProps {
  logOut: () => void
  children: ReactNode
}
interface ErrorBoundaryState {
  hasError: boolean
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state = { hasError: false, message: '' }
  static getDerivedStateFromError = (error: Error) => ({
    hasError: true,
    message: error.message,
  })
  componentDidCatch = (error: Error, errorInfo: React.ErrorInfo) => {
    sendEvent(`Error: ${error.message}`)
    captureError(error, errorInfo)
  }
  render() {
    return this.state.hasError ? (
      <ErrorMessage message={this.state.message} onLogOut={this.props.logOut} />
    ) : (
      this.props.children
    )
  }
}

const mapDispatchToProps = (dispatch: AppDispatch) => ({
  logOut: () => dispatch(logOut()),
})

export default connect(null, mapDispatchToProps)(ErrorBoundary)
