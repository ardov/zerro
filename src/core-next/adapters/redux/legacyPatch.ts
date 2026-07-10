import type { AppThunk } from 'store'
import { applyClientPatch } from 'store/data'
import type { TNormalizedPatch } from '../../types'

/**
 * Funnel entry for not-yet-migrated write paths. Deliberately kept free of the
 * selector graph: entity thunks import this module, and the selector graph
 * imports entity barrels — routing this through the command registry would
 * close a module cycle. The replica step will point both this and
 * `executeCommand` at the same outbox slice action.
 */
export const applyLegacyPatch = (patch: TNormalizedPatch): AppThunk =>
  dispatch => {
    if (Object.keys(patch).length === 0) return
    dispatch(applyClientPatch(patch))
  }
