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
    currentClientTimestamp: Math.floor(Date.now() / 1000),
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
