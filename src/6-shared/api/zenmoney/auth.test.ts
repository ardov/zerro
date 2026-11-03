import { afterEach, describe, expect, it, vi } from 'vitest'
import { authorize, processAuthCode } from './auth'
import { endpoints } from './endpoints'

vi.mock('../../config', () => ({
  clientId: 'test-client',
  clientSecret: 'test-secret',
  redirectUri: 'https://example.test/',
}))

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('authorize', () => {
  it('accepts only its same-origin popup when storage is unavailable', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('localStorage', null)
    const popup = { closed: false } as Window
    vi.spyOn(window, 'open').mockReturnValue(popup)
    const fetch = vi.fn().mockResolvedValue({
      json: async () => ({ access_token: 'test-token' }),
    })
    vi.stubGlobal('fetch', fetch)
    const pending = authorize('app')
    const send = (origin: string, source: Window, code: unknown) =>
      window.dispatchEvent(
        new MessageEvent('message', {
          origin,
          source,
          data: { type: 'zerro:auth-code', code },
        })
      )
    send('https://untrusted.test', popup, 'wrong-origin')
    send(window.location.origin, window, 'wrong-window')
    send(window.location.origin, popup, 123)
    expect(fetch).not.toHaveBeenCalled()
    send(window.location.origin, popup, 'test-code')
    await expect(pending).resolves.toBe('test-token')
    expect(fetch).toHaveBeenCalledWith(
      endpoints.app.token,
      expect.objectContaining({
        body: expect.stringContaining('test-code'),
      })
    )
    expect(vi.getTimerCount()).toBe(0)
    send(window.location.origin, popup, 'late-code')
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('returns a callback code to its opener when storage is unavailable', () => {
    vi.stubGlobal('localStorage', null)
    const postMessage = vi.fn()
    vi.stubGlobal('opener', { postMessage })
    const close = vi.spyOn(window, 'close').mockImplementation(() => undefined)
    window.history.replaceState(null, '', '/?code=test-code')
    try {
      processAuthCode()
      expect(postMessage).toHaveBeenCalledWith(
        { type: 'zerro:auth-code', code: 'test-code' },
        window.location.origin
      )
      expect(close).toHaveBeenCalledOnce()
    } finally {
      window.history.replaceState(null, '', '/')
    }
  })

  it('reports a blocked popup and returns without waiting for a code', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null)
    const alert = vi.fn()
    vi.stubGlobal('alert', alert)
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    await expect(authorize('ru')).resolves.toBeNull()
    expect(alert).toHaveBeenCalledWith(expect.stringMatching(/pop-up/i))
    expect(fetch).not.toHaveBeenCalled()
  })

  it.each(['ru', 'app'] as const)(
    'exchanges the popup code using the %s endpoint and removes its listener',
    async endpoint => {
      vi.useFakeTimers()
      const popup = { closed: false } as Window
      const open = vi.spyOn(window, 'open').mockReturnValue(popup)
      const fetch = vi.fn().mockResolvedValue({
        json: async () => ({ access_token: 'test-token' }),
      })
      vi.stubGlobal('fetch', fetch)
      const pending = authorize(endpoint)
      expect(open).toHaveBeenCalledWith(
        expect.stringContaining(endpoints[endpoint].auth),
        '_blank',
        expect.any(String)
      )
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'unrelated', newValue: 'ignore' })
      )
      expect(fetch).not.toHaveBeenCalled()
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'auth-code-data',
          newValue: 'test-code',
        })
      )
      await expect(pending).resolves.toBe('test-token')
      expect(fetch).toHaveBeenCalledWith(
        endpoints[endpoint].token,
        expect.objectContaining({ body: expect.stringContaining('test-code') })
      )
      expect(vi.getTimerCount()).toBe(0)
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'auth-code-data',
          newValue: 'another-code',
        })
      )
      expect(fetch).toHaveBeenCalledOnce()
    }
  )

  it('stops waiting when the user closes the popup', async () => {
    vi.useFakeTimers()
    const popup = { closed: false }
    vi.spyOn(window, 'open').mockReturnValue(popup as Window)
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    const pending = authorize('ru')
    popup.closed = true
    await vi.advanceTimersByTimeAsync(1000)
    await expect(pending).resolves.toBeNull()
    expect(vi.getTimerCount()).toBe(0)
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'auth-code-data',
        newValue: 'late-code',
      })
    )
    expect(fetch).not.toHaveBeenCalled()
  })
})
