/** Retry-After accepts delay seconds or an HTTP date; return milliseconds in either case. */
export function readRetryAfterMs(response: {
  headers?: { get(name: string): string | null }
}): number | undefined {
  const raw = response.headers?.get('Retry-After')
  if (!raw) return undefined
  const seconds = Number(raw)
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000
  const date = Date.parse(raw)
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : undefined
}
