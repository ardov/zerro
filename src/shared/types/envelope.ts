import { DataEntity, TAccountId, TMerchantId, TTagId } from './data-entities'

export type TEnvelopeType =
  | DataEntity.Account
  | DataEntity.Merchant
  | DataEntity.Tag
  | 'payee'

export type TEnvelopeId =
  | `${DataEntity.Account}#${TAccountId}`
  | `${DataEntity.Merchant}#${TMerchantId}`
  | `${DataEntity.Tag}#${TTagId}`
  | `payee#${string}`
