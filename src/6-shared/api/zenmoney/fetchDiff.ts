import type { TToken, TZmDiff, TZmRequest } from '6-shared/types'
import type { EndpointPreference } from './endpoints'
import { endpoints } from './endpoints'

export const fakeToken = 'fake_token'

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
  const json = await response.json()
  if (json.error) throw Error(JSON.stringify(json.error))

  return json as TZmDiff
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
