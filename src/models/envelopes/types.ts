import { TEnvelopeId, TEnvelopeType } from 'models/shared/envelopeHelpers'
import {
  DataEntity,
  TAccountId,
  TFxCode,
  TISOMonth,
  TMerchantId,
  TTagId,
  ITransaction,
} from 'shared/types'
import { TInstAmount } from './helpers/fxAmount'

interface IEnvelopeBase {
  type: DataEntity.Account | DataEntity.Merchant | DataEntity.Tag
  id: TAccountId | TMerchantId | TTagId
  name: string
  symbol: string
  color: string
  comment?: string
  currency: TFxCode
  keepIncome: boolean
  carryNegatives: boolean

  income: TInstAmount
  outcome: TInstAmount
  budgeted: number
}

interface IEnvelopeAccount extends IEnvelopeBase {
  type: DataEntity.Account
  id: TAccountId
}
interface IEnvelopeMercant extends IEnvelopeBase {
  type: DataEntity.Merchant
  id: TMerchantId
}
interface IEnvelopeTag extends IEnvelopeBase {
  type: DataEntity.Tag
  id: TTagId
  children: TEnvelope[]
}
// type TEnvelope = IEnvelopeAccount | IEnvelopeMercant | IEnvelopeTag

export type TMonthNode = {
  date: TISOMonth
  prevFunds: TInstAmount
  prevOverspent: TInstAmount
  budgeted: number

  groups: Array<{
    name: string
    budgetedTotal: TInstAmount
    activityTotal: TInstAmount
    availableTotal: TInstAmount
    children: Array<{
      type: DataEntity.Account | DataEntity.Merchant | DataEntity.Tag
      symbol: string
      color: string
    }>
  }>
}

// Envelopes

type TStoredEnvelopeInfo = {
  id: TEnvelopeId
  parent?: TEnvelopeId
  comment?: string
  currency?: TFxCode
  keepIncome?: boolean
  carryNegatives?: boolean
}

export type TEnvelope = {
  // Used to connect with ZM entity
  id: TEnvelopeId
  // Parsed from id
  type: TEnvelopeType
  entityId: string
  // From ZM entity
  name: string
  symbol: string
  color: string
  showInBudget: boolean
  // For tags getting this props from ZM entity
  // For other types store in custom storage
  parent: TEnvelopeId | null
  children: TEnvelopeId[]
  // From custom storage
  comment: string
  currency: TFxCode
  keepIncome: boolean
  carryNegatives: boolean
}

/* ——————————————————————————————————————————————————————————————————————————
  STEP 1: Get dates
  From first transaction until last budget or now + 1 month
  Need:
  - first transaction date
  - last budget date
*/

type Dates = TISOMonth[]

/* ——————————————————————————————————————————————————————————————————————————
  STEP 2: Aggregate transaction data
  Need:
  - transactions
  - debt account id
  - inbudget account ids
  - start amounts (from accounts)
  - merchants (to match payee names to merchants)
*/

type TMonthInfo = {
  date: TISOMonth
  balance: TInstAmount // gradually
  balanceChange: TInstAmount
  transferFees: TInstAmount
  transferFeesTransactions: ITransaction[]
  envelopes: {
    [id: TEnvelopeId]: {
      income: TInstAmount
      outcome: TInstAmount
      incomeTransactions: ITransaction[]
      outcomeTransactions: ITransaction[]
    }
  }
}

type TMoneyFlowByMonth = {
  [month: TISOMonth]: TMonthInfo
}

/* ——————————————————————————————————————————————————————————————————————————
  STEP 3: Get budgets by month
  Need:
  - budgets
*/

type BudgetsByMonth = {
  [month: TISOMonth]: {
    [id: TEnvelopeId]: {
      value: number
      currency: TFxCode
    }
  }
}

/* ——————————————————————————————————————————————————————————————————————————
  STEP 2: Get envelopes
  Need:
  - tags
  - accounts
  - merchants
  - hidden data envelopes
  - hidden data structure ?
  - all debtors ?
*/
