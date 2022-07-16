import { TDebtor } from 'models/debtors'
import { TEnvelopeId } from 'models/shared/envelopeHelpers'
import { TTagPopulated } from 'models/tag'
import {
  TISOMonth,
  ITransaction,
  TISODate,
  ById,
  IBudget,
  IAccount,
  TAccountId,
  TFxCode,
  TFxAmount,
} from 'shared/types'
import { IEnvelope } from './parts/envelopes'

type TStoredEnvelopeInfo = {
  id: TEnvelopeId
  showInBudget?: boolean
  parent?: TEnvelopeId
  comment?: string
  currency?: TFxCode
  keepIncome?: boolean
  carryNegatives?: boolean
}

// ——————————————————————————————————————————————————————————————————————————

/*
  🗒 BUDGETS
  Combine envelope and tag budgets into a single object
*/
type BudgetsGetter = (
  hiddenBudgets: Record<TISOMonth, Record<TEnvelopeId, number>>,
  tagBudgets: ById<IBudget>
) => Record<TISOMonth, Record<TEnvelopeId, number>>

type Budgets = ReturnType<BudgetsGetter>

// ——————————————————————————————————————————————————————————————————————————

/*
  📆 MONTH LIST
  From first transaction until last budget or now + 1 month
*/
type MonthListGetter = (
  /** Date of the first transaction */
  firstTransactionDate: TISODate,
  /** Date of the last budget (from budgets) */
  lastBudgetDate: TISODate
) => TISOMonth[]

type MonthList = ReturnType<MonthListGetter>

// ——————————————————————————————————————————————————————————————————————————

/*
  📧 ENVELOPES
  List of all possible envelopes
*/
type EnvelopesGetter = (
  debtors: ById<TDebtor>,
  tags: ById<TTagPopulated>,
  savingAccounts: IAccount[],
  envelopeInfo: ById<TStoredEnvelopeInfo>,
  userCurrency: TFxCode
) => ById<IEnvelope>

type Envelopes = ReturnType<EnvelopesGetter>

// ——————————————————————————————————————————————————————————————————————————

/*
  💰 ACTIVITY
  All transactions grouped affecting budget
*/
type ActivityGetter = (
  transactions: ITransaction[],
  accountsInBudget: IAccount[],
  debtAccId: TAccountId,
  envelopes: Envelopes
) => Record<
  TISOMonth,
  {
    date: TISOMonth
    /** Total balance change of in budget accounts */
    totalActivity: TFxAmount
    /** Unsorted income from envelopes */
    generalIncome: TEnvelopeNode
    /** Transfer fees activity (also includes currency exchange) */
    transferFees: TEnvelopeNode
    /** Activity by envelope */
    envelopes: Record<TEnvelopeId, TEnvelopeNode>
  }
>

type TEnvelopeNode = {
  activity: TFxAmount
  transactions: ITransaction[]
}

type Activity = ReturnType<ActivityGetter>

// ——————————————————————————————————————————————————————————————————————————

/*
  💱 RATES
*/
type RatesGetter = (
  monthList: MonthList,
  currentRates: Record<TFxCode, number>,
  savedRates: Record<TISOMonth, Record<TFxCode, number>>
) => Record<TISOMonth, Record<TFxCode, number>>

type ExchangeRates = ReturnType<RatesGetter>

// ——————————————————————————————————————————————————————————————————————————

/*
  💱 COMPUTED ENVELOPES
*/
type EnvelopeStructureGetter = () => Array<{}>

type EnvelopeStructure = ReturnType<EnvelopeStructureGetter>

// ——————————————————————————————————————————————————————————————————————————

/*
  💱 COMPUTED ENVELOPES
*/
type ComputedEnvelopesGetter = (
  monthList: MonthList,
  rates: ExchangeRates,
  envelopes: Envelopes,
  activity: Activity,
  budgets: Budgets
) => {
  [month: TISOMonth]: {
    [id: TEnvelopeId]: {
      leftover: TFxAmount
      budgeted: TFxAmount
      activity: TFxAmount
      available: TFxAmount

      leftoverSelf: TFxAmount
      budgetedSelf: TFxAmount
      activitySelf: TFxAmount
      availableSelf: TFxAmount

      leftoverChildren: TFxAmount
      budgetedChildren: TFxAmount
      activityChildren: TFxAmount
      availableChildren: TFxAmount
    }
  }
}

type ComputedEnvelopes = ReturnType<ComputedEnvelopesGetter>

// ——————————————————————————————————————————————————————————————————————————

/*
  💰 MONEY AMOUNTS
  All transactions grouped affecting budget
*/
type MoneyAmountsGetter = (activity: Activity, currentBalance: TFxAmount) => {}
