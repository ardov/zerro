import type { TAccountId } from '../../zenmoney/entities/accounts'
import type { TMerchantId } from '../../zenmoney/entities/merchants'
import type { TTagId } from '../../zenmoney/entities/tags'

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
    const separatorIndex = id.indexOf('#')
    return {
      type: id.slice(0, separatorIndex) as EnvType,
      id: id.slice(separatorIndex + 1),
    }
  },
}
