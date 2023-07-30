import { TAccountId, TMerchantId, TTagId } from '6-shared/types'

export enum EnvType {
  Tag = 'tag',
  Account = 'account',
  Merchant = 'merchant',
  Payee = 'payee',
}

export type TEnvelopeId =
  | `${EnvType.Tag}#${TTagId}`
  | `${EnvType.Account}#${TAccountId}`
  | `${EnvType.Merchant}#${TMerchantId}`
  | `${EnvType.Payee}#${string}`

/** Encode and decode envelope ids */
export const envId = {
  /** Combines entity type and its id into envelope id */
  get: (type: EnvType, id: string | null) => {
    return `${type}#${id}` as TEnvelopeId
  },
  /** Splits envelope id into its type and entity id */
  parse: (id: TEnvelopeId) => {
    return {
      type: id.split('#')[0] as EnvType,
      id: id.split('#')[1],
    }
  },
}
