import '@/6-shared/localization'
import '@testing-library/jest-dom/vitest'
import { commands } from 'vitest/browser'

// Each story file gets a fresh iframe. Release detached iframe resources
// before loading the next file: Chromium otherwise drops live WebSockets
// during long runs, even though the page and browser stay open.
await commands.collectBrowserGarbage()

// The test browser has no GPU, so a blurred modal backdrop is painted in
// software and slows every frame under it enough to make timed stories flaky.
// The blur is purely visual and no story asserts it.
const noBackdropBlur = document.createElement('style')
noBackdropBlur.textContent =
  '.kit-modal-backdrop { backdrop-filter: none !important; }'
document.head.append(noBackdropBlur)
