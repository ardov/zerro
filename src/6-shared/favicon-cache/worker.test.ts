// @vitest-environment node
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { faviconUrl, FAVICON_CACHE_NAME } from './index'

const script = readFileSync('public/favicon-cache-sw.js', 'utf8')
const url = (id: number, attempt = 'test') =>
  faviconUrl(`shop${id}.com`, 48, attempt)

function worker() {
  const listeners: Record<string, (event: any) => void> = {}
  const stores = new Map<string, Map<string, Response>>()
  let quotaError = false
  const caches = {
    open: async (name: string) => {
      if (!stores.has(name)) stores.set(name, new Map())
      const store = stores.get(name)!
      return {
        keys: async () => [...store.keys()].map(url => ({ url })),
        match: async (key: { url: string }) => store.get(key.url)?.clone(),
        delete: async (key: { url: string }) => store.delete(key.url),
        put: async (key: string, response: Response) => {
          if (quotaError) throw new DOMException('Full', 'QuotaExceededError')
          store.set(key, response.clone())
        },
      }
    },
    delete: async (name: string) => stores.delete(name),
  }
  const fetch = vi.fn(
    async (_request: Request, _options: RequestInit) =>
      new Response('image bytes')
  )
  runInNewContext(script, {
    self: {
      addEventListener: (type: string, listener: any) => {
        listeners[type] = listener
      },
    },
    caches,
    fetch,
    URL,
    Request,
    Date,
    setTimeout,
    clearTimeout,
  })
  const message = async (data: object, client = 'tab-1') => {
    let done: Promise<unknown> | undefined
    const reply = vi.fn()
    listeners.message({
      data,
      source: { id: client },
      ports: [{ postMessage: reply }],
      waitUntil: (p: Promise<unknown>) => {
        done = p
      },
    })
    await done
    return reply
  }
  const request = (
    target = url(0),
    client = 'tab-1',
    destination = 'image'
  ) => {
    let response: Promise<Response> | undefined
    listeners.fetch({
      request: { url: target, method: 'GET', destination },
      clientId: client,
      respondWith: (p: Promise<Response>) => {
        response = p
      },
      waitUntil: () => {},
    })
    return response
  }
  const load = async (id: number, client = 'tab-1') => {
    await request(url(id), client)
    await message({ type: 'zerro:favicon:loaded', url: url(id) }, client)
  }
  return {
    stores,
    fetch,
    request,
    load,
    message,
    full: () => {
      quotaError = true
    },
  }
}

afterEach(() => vi.useRealTimers())

describe('favicon service worker', () => {
  it('only persists decoded images, shares concurrent requests and serves hits without fetching', async () => {
    const w = worker()
    await Promise.all([w.request(), w.request()])
    expect(w.fetch).toHaveBeenCalledTimes(1)
    expect(w.stores.get(FAVICON_CACHE_NAME)?.size).toBe(0)
    await w.message(
      { type: 'zerro:favicon:loaded', url: url(0) },
      'different-tab'
    )
    expect(w.stores.get(FAVICON_CACHE_NAME)?.size).toBe(0)
    await w.message({ type: 'zerro:favicon:loaded', url: url(0) })
    expect(w.stores.get(FAVICON_CACHE_NAME)?.size).toBe(1)
    await w.request()
    expect(w.fetch).toHaveBeenCalledTimes(1)
  })

  it('does not store failed images, and evicts a cached image that fails decoding', async () => {
    const w = worker()
    await w.request()
    await w.message({ type: 'zerro:favicon:failed', url: url(0) })
    await w.message({ type: 'zerro:favicon:loaded', url: url(0) })
    expect(w.stores.get(FAVICON_CACHE_NAME)?.size).toBe(0)
    await w.load(0)
    await w.request()
    await w.message({ type: 'zerro:favicon:failed', url: url(0) })
    expect(w.stores.get(FAVICON_CACHE_NAME)?.size).toBe(0)
  })

  it('expires at 30 days without extending the lifetime on reads', async () => {
    vi.useFakeTimers()
    const w = worker()
    await w.load(0)
    vi.setSystemTime(Date.now() + 29 * 86400000)
    await w.load(0)
    expect(w.fetch).toHaveBeenCalledTimes(1)
    vi.setSystemTime(Date.now() + 86400000)
    await w.load(0)
    expect(w.fetch).toHaveBeenCalledTimes(2)
    expect(w.fetch).toHaveBeenLastCalledWith(expect.anything(), {
      cache: 'reload',
    })
  })

  it('keeps at most 100 entries under concurrent writes, evicting the oldest', async () => {
    const w = worker()
    for (let i = 0; i < 95; i++) await w.load(i)
    await Promise.all(Array.from({ length: 10 }, (_, i) => w.load(i + 95)))
    expect(w.stores.get(FAVICON_CACHE_NAME)?.size).toBe(100)
    await w.request(url(104))
    expect(w.fetch).toHaveBeenCalledTimes(105)
    await w.load(0)
    expect(w.fetch).toHaveBeenCalledTimes(106)
  })

  it('reset preserves other caches and ignores late confirmations and in-flight responses', async () => {
    const w = worker()
    w.stores.set('app-shell', new Map([['/app.js', new Response('app')]]))
    await w.load(0)
    await w.request(url(1))
    let finish!: (response: Response) => void
    w.fetch.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          finish = resolve
        })
    )
    const inFlight = w.request(url(2))
    await vi.waitFor(() => expect(finish).toBeTypeOf('function'))
    const reply = await w.message({ type: 'zerro:favicon:clear' })
    expect(reply).toHaveBeenCalledWith({ ok: true })
    finish(new Response('late image'))
    await inFlight
    await w.message({ type: 'zerro:favicon:loaded', url: url(1) })
    await w.message({ type: 'zerro:favicon:loaded', url: url(2) })
    expect(w.stores.has(FAVICON_CACHE_NAME)).toBe(false)
    expect(w.stores.get('app-shell')?.size).toBe(1)
    await w.load(0)
    expect(w.stores.get(FAVICON_CACHE_NAME)?.size).toBe(1)
  })

  it.each(['reset', 'timeout'])(
    'ignores old load/error reports after %s and a replacement request',
    async reason => {
      vi.useFakeTimers()
      const w = worker()
      const old = url(0, 'old')
      const next = url(0, 'next')
      await w.request(old)
      if (reason === 'reset') await w.message({ type: 'zerro:favicon:clear' })
      else await vi.advanceTimersByTimeAsync(15000)
      w.fetch.mockResolvedValueOnce(new Response('replacement bytes'))
      await w.request(next)
      await w.message({ type: 'zerro:favicon:loaded', url: old })
      expect(w.stores.get(FAVICON_CACHE_NAME)?.size ?? 0).toBe(0)
      await w.message({ type: 'zerro:favicon:loaded', url: next })
      expect(w.stores.get(FAVICON_CACHE_NAME)?.size).toBe(1)
      await w.message({ type: 'zerro:favicon:failed', url: old })
      expect(w.stores.get(FAVICON_CACHE_NAME)?.size).toBe(1)
    }
  )

  it('shares the persistent cache across attempt tokens without sending tokens to Google', async () => {
    const w = worker()
    await w.load(0)
    await w.request(url(0, 'another'))
    expect(w.fetch).toHaveBeenCalledTimes(1)
    expect(w.fetch.mock.calls[0]?.[0]).toHaveProperty(
      'url',
      faviconUrl('shop0.com', 48)
    )
    expect([...w.stores.get(FAVICON_CACHE_NAME)!.keys()][0]).not.toContain(
      '__zerro_request'
    )
    await w.message({ type: 'zerro:favicon:loaded', url: url(0, 'another') })
  })

  it('purges only favicons on quota error and still returns images', async () => {
    const w = worker()
    w.stores.set('app-shell', new Map())
    await w.load(0)
    w.full()
    await w.load(1)
    expect(w.stores.has(FAVICON_CACHE_NAME)).toBe(false)
    expect(w.stores.has('app-shell')).toBe(true)
    expect(await (await w.request(url(2)))?.text()).toBe('image bytes')
    await w.message({ type: 'zerro:favicon:loaded', url: url(2) })
    expect(w.stores.get(FAVICON_CACHE_NAME)?.size ?? 0).toBe(0)
  })

  it('ignores unrelated requests and releases unconfirmed responses', async () => {
    vi.useFakeTimers()
    const w = worker()
    expect(w.request('https://other.test/icon.png')).toBeUndefined()
    expect(w.request(url(0), 'tab-1', 'script')).toBeUndefined()
    await w.request()
    await vi.advanceTimersByTimeAsync(15000)
    await w.message({ type: 'zerro:favicon:loaded', url: url(0) })
    expect(w.stores.get(FAVICON_CACHE_NAME)?.size).toBe(0)
  })
})
