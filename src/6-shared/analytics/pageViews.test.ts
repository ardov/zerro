import { afterEach, beforeEach, expect, it, vi } from 'vitest'

vi.mock('@/6-shared/config', () => ({
  appVersion: 'test',
  gaid: 'G-TEST',
  isProduction: true,
}))

beforeEach(() => {
  vi.spyOn(document.head, 'appendChild').mockImplementation(node => node)
})

afterEach(() => {
  delete window.gtag
  delete window.dataLayer
  vi.restoreAllMocks()
  vi.resetModules()
})

it('initializes a standalone 404 with sanitized fields and queues one view for the configured stream', async () => {
  const { trackPageView } = await import('./analytics')
  trackPageView(
    '/about/old-link/me%40example.com',
    'https://search.example/private?q=secret#anchor'
  )
  const commands = window.dataLayer!.map(command =>
    Array.from(command as IArguments)
  )
  const context = {
    page_location: location.origin + '/about/old-link/[redacted]',
    page_referrer: 'https://search.example',
  }
  expect(commands).toContainEqual([
    'config',
    'G-TEST',
    { send_page_view: false, ...context },
  ])
  expect(commands.filter(([type]) => type === 'event')).toEqual([
    [
      'event',
      'page_view',
      {
        ...context,
        page_path: '/about/old-link/[redacted]',
        page_title: '404 · Zerro',
        send_to: 'G-TEST',
      },
    ],
  ])
})

it('uses the previous internal page for a virtual 404 and restores the regular page context on return', async () => {
  const { trackPageView } = await import('./analytics')
  const gtag = (window.gtag = vi.fn())
  trackPageView('/about', '')
  trackPageView('/missing', location.origin + '/about?token=secret#section')
  trackPageView('/about', location.origin + '/missing')
  const events = gtag.mock.calls.filter(([command]) => command === 'event')
  expect(events).toHaveLength(3)
  expect(events[1][2]).toMatchObject({
    page_title: '404 · Zerro',
    page_referrer: location.origin + '/about',
  })
  expect(events[2][2]).not.toHaveProperty('page_title')
  expect(events[2][2]).toMatchObject({
    page_location: location.origin + '/about',
    page_referrer: location.origin + '/missing',
  })
  expect(document.head.appendChild).toHaveBeenCalledTimes(1)
})

it.each(['', 'not a URL', 'about:blank'])(
  'records an unavailable referrer as empty (%s)',
  async referrer => {
    const { trackPageView } = await import('./analytics')
    const gtag = (window.gtag = vi.fn())
    trackPageView('/a/123456789/bad%zz', referrer)
    expect(gtag).toHaveBeenCalledWith(
      'event',
      'page_view',
      expect.objectContaining({
        page_path: '/a/[redacted]/[redacted]',
        page_referrer: '',
      })
    )
  }
)
