import type { TNormalizedPatch } from '6-shared/types'
import type { EndpointPreference } from '6-shared/api/zenmoney'
import { zenmoney } from '6-shared/api/zenmoney'
import { convertDiff } from '6-shared/api/zm-adapter'

/** Exchanges a client patch with the Zenmoney server, converting both ways. */
export async function sync(
  token: string,
  preference: EndpointPreference,
  diff: TNormalizedPatch
) {
  const zmDiff = convertDiff.toServer(diff)
  try {
    const data = await zenmoney.fetchDiff(token, preference, zmDiff)
    return { data: convertDiff.toClient(data) }
  } catch (error: any) {
    return { error: error.message as string }
  }
}
