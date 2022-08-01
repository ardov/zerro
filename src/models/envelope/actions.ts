import { TEnvelopeId } from 'shared/types'
import { AppThunk } from 'store'
import { TEnvelopeMeta, patchEnvelopeMeta } from './metaData'
import { getEnvelopes } from './getEnvelopes'

export const setEnvelopeComment =
  (id: TEnvelopeId, comment: TEnvelopeMeta['comment']): AppThunk =>
  (dispatch, getState) =>
    dispatch(patchEnvelopeMeta({ id, comment }))

export const setEnvelopeCurrency =
  (id: TEnvelopeId, currency: TEnvelopeMeta['currency']): AppThunk =>
  (dispatch, getState) =>
    dispatch(patchEnvelopeMeta({ id, currency }))

export const setEnvelopeParent =
  (id: TEnvelopeId, parent: TEnvelopeMeta['parent']): AppThunk =>
  (dispatch, getState) => {
    const envelopes = getEnvelopes(getState())
    if (parent && envelopes[parent]?.parent) {
      console.warn('Parent envelope has parent')
      return
    }
    dispatch(patchEnvelopeMeta({ id, parent }))
  }
