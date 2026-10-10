/** The worker owns the cache; UI only reports image decoding and requests reset. */
export const FAVICON_CACHE_NAME = 'zerro-favicons-v1'

// The token is local to one image attempt. The worker strips it before fetching
// Google and before forming a persistent cache key.
export function faviconUrl(domain: string, size: 48 | 32, requestId?: string) {
  const url = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`
  return requestId ? `${url}&__zerro_request=${requestId}-${size}` : url
}

export function reportFaviconLoad(url: string, loaded: boolean) {
  navigator.serviceWorker?.controller?.postMessage({
    type: loaded ? 'zerro:favicon:loaded' : 'zerro:favicon:failed',
    url,
  })
}

export async function clearFaviconCache(): Promise<void> {
  const worker = navigator.serviceWorker?.controller
  if (!worker) {
    // Storybook, first visit and browsers without SW support. Never wait for a
    // registration that may not exist and never touch another cache namespace.
    if ('caches' in globalThis) await caches.delete(FAVICON_CACHE_NAME)
    return
  }
  await new Promise<void>((resolve, reject) => {
    const channel = new MessageChannel()
    const finish = (success: boolean) => {
      clearTimeout(timeout)
      channel.port1.close()
      channel.port2.close()
      if (success) resolve()
      else reject(new Error('Could not clear favicon cache'))
    }
    const timeout = setTimeout(() => finish(false), 5000)
    channel.port1.onmessage = event => finish(event.data?.ok === true)
    try {
      worker.postMessage({ type: 'zerro:favicon:clear' }, [channel.port2])
    } catch {
      finish(false)
    }
  })
}
