import '@/index.css'
import '@/6-shared/localization'
import { createRoot } from 'react-dom/client'
import { trackPageView } from '@/6-shared/analytics'
import { AppThemeProvider } from '@/6-shared/ui/theme'
import { NotFound } from './index'

const root = document.getElementById('root')
if (root) {
  trackPageView(location.pathname)
  createRoot(root).render(
    <AppThemeProvider>
      <main className="flex min-h-dvh">
        <NotFound />
      </main>
    </AppThemeProvider>
  )
}
