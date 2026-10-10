import { afterEach, expect, it, vi } from 'vitest'
import {
  clearFaviconCache,
  FAVICON_CACHE_NAME,
  reportFaviconLoad,
} from './index'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

it('reports image decoding without requiring a service worker', () => {
  vi.stubGlobal('navigator', {})
  expect(() => reportFaviconLoad('https://example.com', true)).not.toThrow()
  const postMessage = vi.fn()
  vi.stubGlobal('navigator', { serviceWorker: { controller: { postMessage } } })
  reportFaviconLoad('https://example.com', false)
  expect(postMessage).toHaveBeenCalledWith({
    type: 'zerro:favicon:failed',
    url: 'https://example.com',
  })
})

it('clears only the icon cache when no worker controls the page', async () => {
  const remove = vi.fn()
  vi.stubGlobal('navigator', {})
  vi.stubGlobal('caches', { delete: remove })
  await clearFaviconCache()
  expect(remove).toHaveBeenCalledExactlyOnceWith(FAVICON_CACHE_NAME)
})

it('waits for acknowledgement and rejects failed or timed-out resets', async () => {
  vi.useFakeTimers()
  let channel: {
    port1: {
      onmessage?: (event: { data: { ok: boolean } }) => void
      close: () => void
    }
    port2: { close: () => void }
  }
  vi.stubGlobal(
    'MessageChannel',
    class {
      port1 = { close: vi.fn() }
      port2 = { close: vi.fn() }
      constructor() {
        channel = { port1: this.port1, port2: this.port2 }
      }
    }
  )
  const postMessage = vi.fn()
  vi.stubGlobal('navigator', { serviceWorker: { controller: { postMessage } } })
  const success = clearFaviconCache()
  expect(postMessage).toHaveBeenCalledWith({ type: 'zerro:favicon:clear' }, [
    channel!.port2,
  ])
  channel!.port1.onmessage?.({ data: { ok: true } })
  await success
  expect(channel!.port1.close).toHaveBeenCalled()
  const failure = expect(clearFaviconCache()).rejects.toThrow('Could not clear')
  channel!.port1.onmessage?.({ data: { ok: false } })
  await failure
  const timeout = expect(clearFaviconCache()).rejects.toThrow('Could not clear')
  await vi.advanceTimersByTimeAsync(5000)
  await timeout
})
