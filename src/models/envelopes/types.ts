import { TAccountId } from 'models/account'
import { EntityType } from 'models/deletion'
import { TFxCode } from 'models/instrument'
import { TMerchantId } from 'models/merchant'
import { TTagId } from 'models/tag'
import { TISOMonth } from 'shared/types'
import { TFxAmount } from './helpers/fxAmount'

interface IEnvelopeBase {
  type: EntityType.Account | EntityType.Merchant | EntityType.Tag
  id: TAccountId | TMerchantId | TTagId
  name: string
  symbol: string
  color: string
  comment?: string
  currency: TFxCode
  keepIncome: boolean
  carryNegatives: boolean

  income: TFxAmount
  outcome: TFxAmount
  budgeted: number
}

interface IEnvelopeAccount extends IEnvelopeBase {
  type: EntityType.Account
  id: TAccountId
}
interface IEnvelopeMercant extends IEnvelopeBase {
  type: EntityType.Merchant
  id: TMerchantId
}
interface IEnvelopeTag extends IEnvelopeBase {
  type: EntityType.Tag
  id: TTagId
  children: TEnvelope[]
}
type TEnvelope = IEnvelopeAccount | IEnvelopeMercant | IEnvelopeTag

export type TMonthNode = {
  date: TISOMonth
  prevFunds: TFxAmount
  prevOverspent: TFxAmount
  budgeted: number

  groups: Array<{
    name: string
    budgetedTotal: TFxAmount
    activityTotal: TFxAmount
    availableTotal: TFxAmount
    children: Array<{
      type: EntityType.Account | EntityType.Merchant | EntityType.Tag
      symbol: string
      color: string
    }>
  }>
}
