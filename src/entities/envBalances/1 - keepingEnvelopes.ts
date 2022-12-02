import { createSelector } from '@reduxjs/toolkit'
import { shallowEqual } from 'react-redux'
import { TEnvelopeId } from '@shared/types'
import { keys } from '@shared/helpers/keys'
import { TSelector } from '@store/index'
import { envelopeModel } from '@entities/envelope'

export const getKeepingEnvelopes: TSelector<TEnvelopeId[]> = createSelector(
  [envelopeModel.getEnvelopes],
  envelopes => keys(envelopes).filter(id => envelopes[id].keepIncome),
  { memoizeOptions: { resultEqualityCheck: shallowEqual } }
)
