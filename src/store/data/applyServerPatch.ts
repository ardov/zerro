import type { AppThunk } from '@/store'
import type { TAcceptedPushChunk } from '@/zerro-core/replica'
import {
  acceptClientPushChunk,
  rebaseServerInbox,
  receiveServerPatch,
  type TServerInbox,
} from './slice'

/** Stages a canonical patch in the inbox, then rebases pending local entries. */
export const applyServerPatch =
  (patch: TServerInbox): AppThunk =>
  dispatch => {
    dispatch(receiveServerPatch(patch))
    dispatch(rebaseServerInbox())
  }

/** Records one accepted push chunk: Core has already applied it. */
export const applyPushChunk =
  (accepted: TAcceptedPushChunk): AppThunk =>
  dispatch => {
    const { next: _next, progress: _progress, ...replica } = accepted
    dispatch(acceptClientPushChunk(replica))
  }
