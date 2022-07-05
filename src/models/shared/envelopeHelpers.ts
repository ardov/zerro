import { TAccountId } from 'models/account'
import { EntityType } from 'models/deletion'
import { TMerchantId } from 'models/merchant'
import { TTagId } from 'models/tag'

export type TEnvelopeType =
  | EntityType.Account
  | EntityType.Merchant
  | EntityType.Tag
  | 'payee'

export type TEnvelopeId =
  | `${EntityType.Account}#${TAccountId}`
  | `${EntityType.Merchant}#${TMerchantId}`
  | `${EntityType.Tag}#${TTagId}`
  | `payee#${string}`

export function parseEnvelopeId(id: TEnvelopeId) {
  return {
    type: id.split('#')[0] as TEnvelopeType,
    id: id.split('#')[1],
  }
}
export function getEnvelopeId(type: TEnvelopeType, id: string) {
  return `${type}#${id}` as TEnvelopeId
}
