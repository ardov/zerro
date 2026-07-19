import type { EntityPatch } from '../../shared/types'
import type { TFxCode } from '../../zenmoney/instruments/types'
import type { TEnvelopeId } from '../envelope-id'

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

export type TEnvelopeMetaPatch = EntityPatch<
  TEnvelopeMeta,
  | 'group'
  | 'index'
  | 'visibility'
  | 'parent'
  | 'comment'
  | 'currency'
  | 'keepIncome'
  | 'carryNegatives'
>
