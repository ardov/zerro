import React from 'react'
import { captureError } from '6-shared/diagnostics'
import { tokenStorage } from '6-shared/api/tokenStorage'
import { useTranslation } from 'react-i18next'
import { clearPersistedLocalData } from 'store/data'

export default class GlobalErrorBoundary extends React.Component<{
  children: React.ReactNode
}> {
  override state = { hasError: false }

  static getDerivedStateFromError = (_error: any) => ({ hasError: true })

  override componentDidCatch = (error: Error, errorInfo: React.ErrorInfo) => {
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

    captureError(error, errorInfo)
  }

  override render() {
    return this.state.hasError ? <ErrorFallback /> : this.props.children
  }
}

function ErrorFallback() {
  const { t } = useTranslation('errorGlobal')
  const fullRefresh = async () => {
    try {
      await clearPersistedLocalData()
    } catch (error) {
      console.error('Failed to clear local replica before reload', error)
    } finally {
      localStorage.clear()
      tokenStorage.clear()
      window.location.reload()
    }
  }

  return (
    <div style={{ margin: '0 auto', padding: 40 }}>
      <h3>{t('message')}</h3>
      <button
        style={{ border: '1px solid #ccc', padding: 16 }}
        onClick={() => void fullRefresh()}
      >
        {t('btnFix')}
      </button>
    </div>
  )
}
