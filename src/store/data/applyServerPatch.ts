import type { AppThunk } from '@/store'
import type { TAcceptedPushChunk } from '@/zerro-core/replica'
import { acceptClientPushChunk } from './slice'

export const applyPushChunk =
  (accepted: TAcceptedPushChunk): AppThunk =>
  dispatch => {
    const { next: _next, progress: _progress, ...replica } = accepted
    dispatch(acceptClientPushChunk(replica))
  }
