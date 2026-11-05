import type { TNormalizedPatch, TZmDiff, TZmRequest } from '@/6-shared/types'

import { convertDiff } from './converters'

/**
 * The size of the body a push will actually put on the wire.
 *
 * Core bounds a chunk in bytes, but it plans in normalized entities, where
 * timestamps are milliseconds and a budget still carries its derived id. This
 * is the seam that knows the difference, so the bound is checked against the
 * representation that travels rather than against the one that is planned.
 */
export function measureRequestBytes(request: TNormalizedPatch): number {
  const body: TZmRequest = {
    ...(convertDiff.toServer(request) as TZmDiff),
    // The transport fills this in per request; reserve the widest value it
    // can take rather than guessing the clock.
    currentClientTimestamp: Number.MAX_SAFE_INTEGER,
  }
  return new TextEncoder().encode(JSON.stringify(body)).byteLength
}
