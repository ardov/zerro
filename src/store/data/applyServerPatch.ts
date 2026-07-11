import type { AppThunk } from 'store'
import {
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
