import '@/6-shared/localization'
import '@testing-library/jest-dom/vitest'
import { commands } from 'vitest/browser'

// Release detached story iframes before Chromium runs out of resources and drops live WebSockets.
await commands.collectBrowserGarbage()

// Disable backdrop blur in software-rendered tests to avoid timing failures.
const noBackdropBlur = document.createElement('style')
noBackdropBlur.textContent =
  '.kit-modal-backdrop { backdrop-filter: none !important; }'
document.head.append(noBackdropBlur)
