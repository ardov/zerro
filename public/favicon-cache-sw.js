/* Imported by the generated service worker. Keep the message protocol and cache
 * name in sync with src/6-shared/favicon-cache/index.ts. No app data lives here. */
;(() => {
  const CACHE = 'zerro-favicons-v1'
  const MAX_ENTRIES = 100
  const MAX_AGE = 30 * 24 * 60 * 60 * 1000
  const REQUEST = '__zerro_request'
  const STAMP = '__zerro_cached_at'
  const pending = new Map()
  let generation = 0
  let writesDisabled = false
  let queue = Promise.resolve()

  // Serialize cache mutations, including clear, so concurrent image loads cannot
  // exceed the cap or restore a response that was in flight before a reset.
  function serial(action) {
    const result = queue.then(action)
    queue = result.catch(() => {})
    return result
  }

  function isFavicon(value) {
    try {
      const url = new URL(value)
      return (
        url.origin === 'https://www.google.com' &&
        url.pathname === '/s2/favicons' &&
        !!url.searchParams.get('domain') &&
        ['48', '32'].includes(url.searchParams.get('sz'))
      )
    } catch {
      return false
    }
  }

  async function entries(cache) {
    const live = []
    for (const key of await cache.keys()) {
      const url = new URL(key.url)
      const stamp = Number(url.searchParams.get(STAMP))
      url.searchParams.delete(STAMP)
      if (!stamp || Date.now() - stamp >= MAX_AGE || !isFavicon(url.href)) {
        await cache.delete(key)
      } else {
        live.push({ key, url: url.href })
      }
    }
    return live
  }

  async function save(item) {
    if (
      item.generation !== generation ||
      writesDisabled ||
      !item.response ||
      item.cacheKey
    )
      return
    try {
      const cache = await caches.open(CACHE)
      const live = await entries(cache)
      if (live.some(entry => entry.url === item.url)) return
      while (live.length >= MAX_ENTRIES) await cache.delete(live.shift().key)
      const key = new URL(item.url)
      key.searchParams.set(STAMP, String(Date.now()))
      await cache.put(key.href, item.response)
    } catch (error) {
      // Opaque responses can consume a large quota. Storage is an optimization;
      // never let a full/disabled cache break the image or the offline app shell.
      if (error.name === 'QuotaExceededError') {
        writesDisabled = true
        await caches.delete(CACHE)
      }
    }
  }

  self.addEventListener('fetch', event => {
    const { request, clientId } = event
    if (
      request.method !== 'GET' ||
      request.destination !== 'image' ||
      !isFavicon(request.url)
    )
      return
    const target = new URL(request.url)
    const requestId = target.searchParams.get(REQUEST)
    // Older/uncontrolled clients still load normally, without ambiguous reports.
    if (!requestId) return
    const id = `${clientId}:${target.href}`
    target.searchParams.delete(REQUEST)
    const url = target.href
    let item = pending.get(id)
    if (!item) {
      item = { url, generation, response: null }
      let finish
      const confirmed = new Promise(resolve => {
        finish = resolve
      })
      const timer = setTimeout(() => item.finish(), 15000)
      item.finish = () => {
        clearTimeout(timer)
        if (pending.get(id) === item) pending.delete(id)
        finish()
      }
      pending.set(id, item)
      // Bound temporary responses as well, including images unmounted before load.
      if (pending.size > MAX_ENTRIES) pending.values().next().value.finish()
      item.result = (async () => {
        const cached = await serial(async () => {
          if (item.generation !== generation) return
          const cache = await caches.open(CACHE)
          const entry = (await entries(cache)).find(entry => entry.url === url)
          if (!entry) return
          item.cacheKey = entry.key
          return cache.match(entry.key)
        }).catch(() => undefined)
        if (cached) {
          return cached
        }
        // A reset/expiry really refreshes the image, even if its HTTP cache has
        // a longer lifetime. Normal hits above cause no network request at all.
        const response = await fetch(new Request(url, request), {
          cache: 'reload',
        })
        if (pending.get(id) === item) item.response = response.clone()
        return response
      })().catch(error => {
        item.finish()
        throw error
      })
      event.waitUntil(confirmed)
    }
    event.respondWith(item.result.then(response => response.clone()))
  })

  self.addEventListener('message', event => {
    const data = event.data
    if (data?.type === 'zerro:favicon:clear') {
      generation++
      writesDisabled = false
      for (const item of pending.values()) item.finish()
      const cleared = serial(() => caches.delete(CACHE))
      event.waitUntil(
        cleared.then(
          () => event.ports[0]?.postMessage({ ok: true }),
          () => event.ports[0]?.postMessage({ ok: false })
        )
      )
    } else if (data?.type === 'zerro:favicon:loaded' && isFavicon(data.url)) {
      const id = `${event.source?.id}:${new URL(data.url).href}`
      const item = pending.get(id)
      if (!item) return
      // Only an actual <img> load event permits storing an opaque response.
      event.waitUntil(serial(() => save(item)).finally(() => item.finish()))
    } else if (data?.type === 'zerro:favicon:failed' && isFavicon(data.url)) {
      const url = new URL(data.url).href
      const item = pending.get(`${event.source?.id}:${url}`)
      if (!item) return
      item.finish()
      event.waitUntil(
        serial(async () => {
          if (item.generation !== generation || !item.cacheKey) return
          const cache = await caches.open(CACHE)
          await cache.delete(item.cacheKey)
        }).catch(() => {})
      )
    }
  })
})()
