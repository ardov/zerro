import { HiddenDataType, makeSimpleHiddenStore } from 'models/hidden-store'
import { ById, OptionalExceptFor, TEnvelopeId, TFxCode } from 'shared/types'
import { AppThunk } from 'store'

export enum envelopeVisibility {
  hidden = 'hidden',
  visible = 'visible',
  auto = 'auto',
}

export type TEnvelopeMeta = {
  id: TEnvelopeId
  group?: string
  visibility?: envelopeVisibility
  parent?: TEnvelopeId
  comment?: string
  currency?: TFxCode
  keepIncome?: boolean
  carryNegatives?: boolean
}

export const envelopeMetaStore = makeSimpleHiddenStore<ById<TEnvelopeMeta>>(
  HiddenDataType.EnvelopeMeta,
  {}
)

export const getEnvelopeMeta = envelopeMetaStore.getData

export type TEnvelopeMetaPatch = OptionalExceptFor<TEnvelopeMeta, 'id'>

export const patchEnvelopeMeta =
  (updates: TEnvelopeMetaPatch | TEnvelopeMetaPatch[]): AppThunk =>
  (dispatch, getState) => {
    const currentData = getEnvelopeMeta(getState())
    const updateList = Array.isArray(updates) ? updates : [updates]

    const newData = { ...currentData }
    updateList.forEach(update => {
      newData[update.id] = { ...currentData[update.id], ...update }
    })

    dispatch(envelopeMetaStore.setData(newData))
  }
