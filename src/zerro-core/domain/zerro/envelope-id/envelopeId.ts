import type { TAccountId } from '../../zenmoney/accounts'
import type { TMerchantId } from '../../zenmoney/merchants'
import type { TTagId } from '../../zenmoney/tags'

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

export const envId = {
  get: (type: EnvType, id: string | null) => {
    return `${type}#${id}` as TEnvelopeId
  },
  parse: (id: TEnvelopeId) => {
    return {
      type: id.split('#')[0] as EnvType,
      id: id.split('#')[1],
    }
  },
}
