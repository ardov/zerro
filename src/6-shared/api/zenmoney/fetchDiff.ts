import type { TToken, TZmDiff, TZmRequest } from '@/6-shared/types'
import type { EndpointPreference } from './endpoints'
import { endpoints } from './endpoints'
import { readRetryAfterMs } from './retryAfter'

export const fakeToken = 'fake_token'

export class DiffRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly retryAfterMs?: number
  ) {
    super(message)
  }
}

export async function fetchDiff(
  token: TToken,
  preference: EndpointPreference,
  diff: TZmDiff = { serverTimestamp: 0 }
) {
  if (!token) throw Error('No token')

  if (token === fakeToken) {
    // If token is fake, pretend we got data from server
    return { ...diff, serverTimestamp: Math.ceil(Date.now() / 1000) }
  }

  const url = endpoints[preference].diff
  const body: TZmRequest = {
    ...diff,
    currentClientTimestamp: getCurrentClientTimestamp(diff),
  }

  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  // A failing status may carry HTML or an empty body. Include the status in the
  // error instead of leaking an unhelpful bare SyntaxError.
  const text = await response.text()
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new DiffRequestError(
      `Unparsable diff response (HTTP ${response.status})`,
      response.status,
      readRetryAfterMs(response)
    )
  }

  const apiError = readApiError(json)
  if (apiError)
    throw new DiffRequestError(
      JSON.stringify(apiError),
      response.status,
      readRetryAfterMs(response)
    )

  if (response.status < 200 || response.status >= 300) {
    throw new DiffRequestError(
      `Diff request failed (HTTP ${response.status})`,
      response.status,
      readRetryAfterMs(response)
    )
  }

  return json as TZmDiff
}

function readApiError(body: unknown): unknown {
  if (!body || typeof body !== 'object') return undefined
  return (body as { error?: unknown }).error
}

function getCurrentClientTimestamp(diff: TZmDiff): number {
  let timestamp = Math.floor(Date.now() / 1000)

  Object.values(diff).forEach(value => {
    if (!Array.isArray(value)) return

    value.forEach(entity => {
      if (!entity || typeof entity !== 'object') return
      if ('changed' in entity && typeof entity.changed === 'number') {
        timestamp = Math.max(timestamp, entity.changed)
      }
      if ('stamp' in entity && typeof entity.stamp === 'number') {
        timestamp = Math.max(timestamp, entity.stamp)
      }
    })
  })

  return timestamp
}
