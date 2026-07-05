import type { ById, TDataStore, TFxCode } from '6-shared/types'
import type { TEnvelopeId } from '../envelope-id'
import { getSimpleHiddenData, HiddenDataType } from '../hidden-data'

export enum envelopeVisibility {
  hidden = 'hidden',
  visible = 'visible',
  auto = 'auto',
}

export type TEnvelopeMeta = {
  id: TEnvelopeId
  group?: string
  index?: number
  visibility?: envelopeVisibility
  parent?: TEnvelopeId
  comment?: string
  currency?: TFxCode
  keepIncome?: boolean
  carryNegatives?: boolean
}

export function getEnvelopeMeta(data: TDataStore): ById<TEnvelopeMeta> {
  return getSimpleHiddenData<ById<TEnvelopeMeta>>(
    data,
    HiddenDataType.EnvelopeMeta,
    {}
  )
}
