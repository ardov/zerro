import { afterEach, describe, expect, it, vi } from 'vitest'
import { authorize } from './auth'
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
