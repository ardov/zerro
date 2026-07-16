import { afterEach, describe, expect, it, vi } from 'vitest'

import type { TZmDiff } from '6-shared/types'
import { fetchDiff } from './fetchDiff'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('fetchDiff', () => {
  it('does not send a client timestamp older than an entity version', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_500_000)
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ serverTimestamp: 1_500 }),
    })
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
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ serverTimestamp: 1_500 }),
    })
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
})
