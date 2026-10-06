import '@/6-shared/localization'
import '@testing-library/jest-dom/vitest'

// The test browser has no GPU, so a blurred modal backdrop is painted in
// software and slows every frame under it enough to make timed stories flaky.
// The blur is purely visual and no story asserts it.
const noBackdropBlur = document.createElement('style')
noBackdropBlur.textContent =
  '.kit-modal-backdrop { backdrop-filter: none !important; }'
document.head.append(noBackdropBlur)
