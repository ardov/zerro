import { v1 as uuidv1 } from 'uuid'
import { compilePatchEnvelope } from 'core-next/zerro/envelopes'
import { selectCoreEnvelopes } from 'core-next/adapters/redux'
import type { AppThunk } from 'store'
import { applyClientPatch } from 'store/data'
import { OptionalExceptFor } from '6-shared/types'
import { TEnvelope } from './shared/makeEnvelope'

export type TEnvelopeDraft = OptionalExceptFor<TEnvelope, 'id'>

export const patchEnvelope =
  (draft: TEnvelopeDraft | TEnvelopeDraft[]): AppThunk =>
  (dispatch, getState) => {
    const state = getState()
    const patch = compilePatchEnvelope(
      state.data.current,
      selectCoreEnvelopes(state),
      draft,
      { now: Date.now, uuid: uuidv1 }
    )

    if (Object.keys(patch).length) dispatch(applyClientPatch(patch))
  }
