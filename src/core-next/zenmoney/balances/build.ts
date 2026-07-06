import { GroupBy, makeDateArray, toISODate } from '6-shared/helpers/date'
import { entries } from '6-shared/helpers/keys'
import { isZero, subFxAmount } from '6-shared/helpers/money'
import type {
  AccountType,
  ById,
  TAccountId,
  TISODate,
  TFxAmount,
  TFxCode,
  TInstrumentId,
  TMerchant,
  TTransaction,
  TTransactionId,
  TDateDraft,
} from '6-shared/types'
import { cleanPayee, TDebtor } from '../debtors'
import { getTransactionType, TrType } from '../transactions'

export type TBalanceState<Value = TFxAmount> = {
  accounts: Record<TAccountId, Value>
  debtors: Record<string, Value>
}

export type TBalanceNode<Value = TFxAmount> = {
  date: TISODate
  balances: TBalanceState<Value>
}

export type TTransactionEffect = {
  id: TTransactionId
  date: TISODate
  accounts?: Record<TAccountId, TFxAmount>
  debtors?: Record<string, TFxAmount>
}

export type TBalanceAccount = {
  id: TAccountId
  type: AccountType
  fxCode: TFxCode
  balance: number
}

export type TBuildBalancesInput = {
  transactions: TTransaction[]
  accounts: ById<TBalanceAccount>
  debtors: ById<TDebtor>
  merchants: ById<TMerchant>
  instrumentCodeById: Record<TInstrumentId, TFxCode>
  debtAccountId?: TAccountId
}

export type TBalances = {
  byDay: Record<TISODate, TBalanceState>
  byTransaction: Record<TTransactionId, TBalanceState>
  startingBalances: TBalanceState
}

export function buildBalances(input: TBuildBalancesInput): TBalances {
  const byDay: Record<TISODate, TBalanceState> = {}
  const byTransaction: Record<TTransactionId, TBalanceState> = {}
  let lastState = getCurrentBalanceState(input.accounts, input.debtors)

  for (let index = input.transactions.length - 1; index >= 0; index--) {
    const change = buildTransactionEffect(input.transactions[index], input)
    byDay[change.date] = byDay[change.date] || lastState
    byTransaction[change.id] = lastState
    lastState = subtractChange(lastState, change)
  }

  Object.values(lastState.debtors).forEach(amount => {
    console.assert(isZero(amount), 'Starting amount of debtor is not zero')
  })

  return { byDay, byTransaction, startingBalances: lastState }
}

export function buildTransactionEffect(
  transaction: TTransaction,
  input: {
    merchants: ById<TMerchant>
    instrumentCodeById: Record<TInstrumentId, TFxCode>
    debtAccountId?: TAccountId
  }
): TTransactionEffect {
  const { id, incomeAccount, outcomeAccount, income, outcome, date } =
    transaction
  const type = getTransactionType(transaction, input.debtAccountId)
  const incomeFx = input.instrumentCodeById[transaction.incomeInstrument]
  const outcomeFx = input.instrumentCodeById[transaction.outcomeInstrument]
  const effect: TTransactionEffect = { id, date }

  switch (type) {
    case TrType.Income:
      effect.accounts = { [incomeAccount]: { [incomeFx]: income } }
      break

    case TrType.Outcome:
      effect.accounts = { [outcomeAccount]: { [outcomeFx]: -outcome } }
      break

    case TrType.Transfer:
      effect.accounts = {
        [incomeAccount]: { [incomeFx]: income },
        [outcomeAccount]: { [outcomeFx]: -outcome },
      }
      break

    case TrType.IncomeDebt:
      effect.accounts = { [incomeAccount]: { [incomeFx]: income } }
      effect.debtors = {
        [getDebtorId(transaction, input.merchants)]: { [outcomeFx]: -income },
      }
      break

    case TrType.OutcomeDebt:
      effect.accounts = { [outcomeAccount]: { [outcomeFx]: -outcome } }
      effect.debtors = {
        [getDebtorId(transaction, input.merchants)]: { [incomeFx]: outcome },
      }
      break

    default:
      throw new Error('Unknown type ' + type)
  }

  return effect
}

export function buildBalancesByDate(input: {
  balances: TBalances
  historyStart: TISODate
  currentDate: Date | TISODate
}): TBalanceNode[] {
  const dates = makeDateArray(input.historyStart, input.currentDate, GroupBy.Day)
  let lastUsedBalance = input.balances.startingBalances

  return dates.map(date => {
    const balances = input.balances.byDay[date] || lastUsedBalance
    lastUsedBalance = balances
    return { date, balances }
  })
}

export function convertBalancesToDisplay(
  list: Array<TBalanceNode<TFxAmount>>,
  convert: (amount: TFxAmount, date: TDateDraft) => number
): Array<TBalanceNode<number>> {
  return list.map(node => {
    const displayNode: TBalanceNode<number> = {
      date: node.date,
      balances: { accounts: {}, debtors: {} },
    }

    entries(node.balances.accounts).forEach(([id, amount]) => {
      const value = convert(amount, node.date)
      console.assert(
        Number.isFinite(value),
        'Not converted correctly: ' + JSON.stringify(amount)
      )
      displayNode.balances.accounts[id] = value
    })

    entries(node.balances.debtors).forEach(([id, amount]) => {
      const value = convert(amount, node.date)
      console.assert(
        Number.isFinite(value),
        'Not converted correctly: ' + JSON.stringify(amount)
      )
      displayNode.balances.debtors[id] = value
    })

    return displayNode
  })
}

export function getHistoryStart(
  transactions: TTransaction[],
  currentDate: Date | TISODate
): TISODate {
  const firstReasonableDate = '2000-01-01' as TISODate
  const currentISODate = toISODate(currentDate)
  const firstTransaction = transactions.find(
    transaction =>
      transaction.date >= firstReasonableDate && transaction.date <= currentISODate
  )
  if (!firstTransaction) return currentISODate
  return firstTransaction.date
}

function subtractChange(
  state: TBalanceState,
  change: TTransactionEffect
): TBalanceState {
  const nextState: TBalanceState = { ...state }

  if (change.accounts) {
    nextState.accounts = { ...nextState.accounts }
    entries(change.accounts).forEach(([id, amount]) => {
      nextState.accounts[id] = subFxAmount(nextState.accounts[id], amount)
    })
  }

  if (change.debtors) {
    nextState.debtors = { ...nextState.debtors }
    entries(change.debtors).forEach(([id, amount]) => {
      nextState.debtors[id] = subFxAmount(nextState.debtors[id], amount)
    })
  }

  return nextState
}

function getCurrentBalanceState(
  accounts: ById<TBalanceAccount>,
  debtors: ById<TDebtor>
): TBalanceState {
  const result: TBalanceState = {
    accounts: {},
    debtors: {},
  }

  Object.values(accounts).forEach(account => {
    if (account.type === 'debt') return
    result.accounts[account.id] = { [account.fxCode]: account.balance }
  })
  Object.values(debtors).forEach(debtor => {
    result.debtors[debtor.id] = debtor.balance
  })

  return result
}

function getDebtorId(transaction: TTransaction, merchants: ById<TMerchant>) {
  const merchantTitle = transaction.merchant && merchants[transaction.merchant]?.title
  return cleanPayee(merchantTitle || transaction.payee || '')
}
