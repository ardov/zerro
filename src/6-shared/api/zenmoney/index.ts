import { fetchDiff, fakeToken } from './fetchDiff'
import { authorize, processAuthCode } from './auth'
export type { EndpointPreference } from './endpoints'

export const zenmoney = {
  processAuthCode,
  authorize,
  fetchDiff,
  fakeToken,
}
