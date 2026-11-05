/**
 * `Retry-After` as milliseconds, in the one form both transports read.
 *
 * The header comes in two shapes — delay seconds, or an HTTP date — and a
 * transport that understands only the first silently falls back to its own
 * backoff whenever the server sends the second.
 */
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
