import type { TNormalizedPatch, TZmDiff, TZmRequest } from '@/6-shared/types'

import { convertDiff } from './converters'

/** Measure the serialized wire payload: normalized timestamps and derived IDs differ from what is sent. */
export function measureRequestBytes(request: TNormalizedPatch): number {
  const body: TZmRequest = {
    ...(convertDiff.toServer(request) as TZmDiff),
    // The transport fills this in per request; reserve the widest value it
    // can take rather than guessing the clock.
    currentClientTimestamp: Number.MAX_SAFE_INTEGER,
  }
  return new TextEncoder().encode(JSON.stringify(body)).byteLength
}
