import { afterEach, describe, expect, it, vi } from 'vitest'

import type { TZmDiff } from '@/6-shared/types'
import { fetchDiff } from './fetchDiff'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const respondWith = (status: number, body: string) =>
  vi.fn().mockResolvedValue({ status, text: async () => body })

const respondOk = (body: unknown) => respondWith(200, JSON.stringify(body))

describe('fetchDiff', () => {
  it('does not send a client timestamp older than an entity version', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_500_000)
    const fetchMock = respondOk({ serverTimestamp: 1_500 })
    vi.stubGlobal('fetch', fetchMock)

    await fetchDiff('token', 'ru', {
      serverTimestamp: 1_400,
      transaction: [{ id: 'tr-1', changed: 1_501 }],
    } as unknown as TZmDiff)

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(JSON.parse(request.body as string)).toMatchObject({
      currentClientTimestamp: 1_501,
      transaction: [{ id: 'tr-1', changed: 1_501 }],
    })
  })

  it('uses the current clock when all writes are older', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_500_000)
    const fetchMock = respondOk({ serverTimestamp: 1_500 })
    vi.stubGlobal('fetch', fetchMock)

    await fetchDiff('token', 'ru', {
      serverTimestamp: 1_400,
      transaction: [{ id: 'tr-1', changed: 1_499 }],
    } as unknown as TZmDiff)

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(JSON.parse(request.body as string).currentClientTimestamp).toBe(
      1_500
    )
  })

  it('preserves a structured validation error message', async () => {
    vi.stubGlobal(
      'fetch',
      respondWith(
        400,
        JSON.stringify({
          error: {
            code: 'validationError',
            message: 'Invalid Relation "Tag" in Object Budget',
            details: { object: 'budget', objectID: 'tag-1#2026-07-01' },
          },
        })
      )
    )

    await expect(
      fetchDiff('token', 'ru', { serverTimestamp: 1 })
    ).rejects.toThrow(
      '"details":{"object":"budget","objectID":"tag-1#2026-07-01"}'
    )
  })

  it('includes the HTTP status for a non-JSON server failure', async () => {
    vi.stubGlobal('fetch', respondWith(502, '<html>Bad gateway</html>'))

    await expect(
      fetchDiff('token', 'ru', { serverTimestamp: 1 })
    ).rejects.toThrow('Unparsable diff response (HTTP 502)')
  })

  it('exposes status and Retry-After for transport policy', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { message: 'slow down' } }), {
          status: 429,
          headers: { 'Retry-After': '3' },
        })
      )
    )

    await expect(
      fetchDiff('token', 'ru', { serverTimestamp: 1 })
    ).rejects.toMatchObject({ status: 429, retryAfterMs: 3000 })
  })

  it('rejects a successful response that is not parsable JSON', async () => {
    vi.stubGlobal('fetch', respondWith(200, 'not json'))

    await expect(
      fetchDiff('token', 'ru', { serverTimestamp: 1 })
    ).rejects.toThrow('Unparsable diff response (HTTP 200)')
  })
})
