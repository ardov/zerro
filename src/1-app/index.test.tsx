import { afterEach, expect, it, vi } from 'vitest'

vi.mock('./App', () => ({ default: () => null }))
vi.mock('./Providers', () => ({ Providers: () => null }))
vi.mock('virtual:pwa-register', () => ({ registerSW: vi.fn() }))
vi.mock('@/6-shared/diagnostics', () => ({ initSentry: vi.fn() }))

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.resetModules()
})

it.each(['null', 'blocked'])(
  'boots and changes preferences when localStorage is %s',
  async mode => {
    vi.resetModules()
    if (mode === 'null') vi.stubGlobal('localStorage', null)
    else {
      vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
        throw new DOMException('Storage blocked', 'SecurityError')
      })
    }

    await expect(import('./index')).resolves.toHaveProperty('MainApp')
    const { store } = await import('@/store')
    expect(store.getState().token).toBeNull()
    const debug = (
      window as unknown as { zerro: { toggleLogs: () => boolean } }
    ).zerro
    expect(debug.toggleLogs()).toBe(true)
    expect(debug.toggleLogs()).toBe(false)

    const { i18n } = await import('@/6-shared/localization')
    await i18n.changeLanguage('en')
    expect(document.documentElement.lang).toBe('en')
    const { setSavedCurrency } = await import('@/store/displayCurrency')
    store.dispatch(setSavedCurrency('USD'))
    expect(store.getState().displayCurrency).toBe('USD')
  }
)
