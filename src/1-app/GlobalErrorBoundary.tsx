import React from 'react'
import { captureError, sendEvent } from '6-shared/helpers/tracking'
import { clearStorage } from 'worker'
import { tokenStorage } from '6-shared/api/tokenStorage'
import { useTranslation } from 'react-i18next'

export default class GlobalErrorBoundary extends React.Component<{
  children: React.ReactNode
}> {
  state = { hasError: false }

  static getDerivedStateFromError = (error: any) => ({ hasError: true })

  componentDidCatch = (error: Error, errorInfo: React.ErrorInfo) => {
    // Automatically reload the page if a chunk fails to load
    // This usually happens after a new deployment
    if (
      error.message.includes('Loading chunk') ||
      error.message.includes('dynamically imported module')
    ) {
      const isReloaded = sessionStorage.getItem('global_error_retry')
      if (!isReloaded) {
        sessionStorage.setItem('global_error_retry', 'true')
        window.location.reload()
        return
      }
      sessionStorage.removeItem('global_error_retry')
    }

    sendEvent(`GlobalError: ${error.message}`)
    captureError(error, errorInfo)
  }

  render() {
    return this.state.hasError ? <ErrorFallback /> : this.props.children
  }
}

function ErrorFallback() {
  const { t } = useTranslation('errorGlobal')
  const fullRefresh = () => {
    clearStorage()
    localStorage.clear()
    tokenStorage.clear()
    window.location.reload()
  }

  return (
    <div style={{ margin: '0 auto', padding: 40 }}>
      <h3>{t('message')}</h3>
      <button
        style={{ border: '1px solid #ccc', padding: 16 }}
        onClick={fullRefresh}
      >
        {t('btnFix')}
      </button>
    </div>
  )
}
