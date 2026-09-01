import type { TNormalizedPatch } from '@/6-shared/types'
import type { EndpointPreference } from '@/6-shared/api/zenmoney'
import { zenmoney } from '@/6-shared/api/zenmoney'
import { DiffRequestError } from '@/6-shared/api/zenmoney/fetchDiff'
import { convertDiff } from '@/6-shared/api/zm-adapter'

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
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      error: message.slice(0, 500) || 'Unknown sync failure',
      ...(error instanceof DiffRequestError
        ? {
            status: error.status,
            retryAfterMs: error.retryAfterMs,
          }
        : {}),
    }
  }
}
