import React, { ReactNode } from 'react'
import { connect } from 'react-redux'
import { logOut } from '4-features/authorization'
import { captureError } from '6-shared/diagnostics'
import { ErrorMessage } from './ErrorMessage'
import { AppDispatch } from 'store'

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
  override state = { hasError: false, message: '' }
  static getDerivedStateFromError = (error: Error) => ({
    hasError: true,
    message: error.message,
  })
  override componentDidCatch = (error: Error, errorInfo: React.ErrorInfo) => {
    captureError(error, errorInfo)
  }
  override render() {
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
