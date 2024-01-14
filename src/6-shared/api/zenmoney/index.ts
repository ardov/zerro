import { fetchDiff } from './fetchDiff'
import { authorize, processAuthCode } from './auth'

export const zenmoney = {
  processAuthCode,
  authorize,
  fetchDiff,
}
