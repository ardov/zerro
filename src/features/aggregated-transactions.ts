import { add, sub } from 'helpers/currencyHelpers'
import { getType } from 'store/data/transactions/helpers'
import {
  TAccountId,
  TInstrumentId,
  TMerchantId,
  TTagId,
  TRawTransaction,
  TrType,
} from 'types'

type TFxAmount = {
  [currency: TInstrumentId]: number
}

type TAccumulated = {
  amount: TFxAmount
  transactions: TRawTransaction[]
}

type TMonthInfo = {
  date: string // YYYY-MM
  budget_total: TFxAmount
  budget_incomes: {
    [tagId: TTagId]: TAccumulated
  }
  budget_outcomes: {
    [tagId: TTagId]: TAccumulated
  }
  budget_payeeDebts: {
    [payee: string]: TAccumulated
  }
  budget_merchantDebts: {
    [merchant: TMerchantId]: TAccumulated
  }
  budget_transfers: {
    [accId: TAccountId]: TAccumulated
  }
  budget_transferFees: TAccumulated
}

type TMoneyFlowByMonth = {
  [month: string]: TMonthInfo
}

const makeAccumulatedNode = (): TAccumulated => ({
  amount: {},
  transactions: [],
})

const makeMonthInfo = (date: TMonthInfo['date']): TMonthInfo => ({
  date,
  budget_total: {},
  budget_incomes: {},
  budget_outcomes: {},
  budget_payeeDebts: {},
  budget_merchantDebts: {},
  budget_transfers: {},
  budget_transferFees: makeAccumulatedNode(),
})

export function getRealMoneyFlow(
  transactions: TRawTransaction[],
  inBudgetAccIds: TAccountId[],
  debtAccId: TAccountId
): TMoneyFlowByMonth {
  const result: TMoneyFlowByMonth = {}

  transactions.forEach(tr => {
    if (!isInBudget(tr, inBudgetAccIds)) return
    const date = getTrMonth(tr)
    const type = getType(tr, debtAccId)
    const mainTag = getMainTag(tr) || 'null'
    result[date] ??= makeMonthInfo(date)
    addToTotal(result[date], tr, inBudgetAccIds)

    if (type === TrType.income) {
      result[date].budget_incomes[mainTag] ??= makeAccumulatedNode()
      result[date].budget_incomes[mainTag].amount[tr.incomeInstrument] ??= 0
      result[date].budget_incomes[mainTag].amount[tr.incomeInstrument] = add(
        tr.income,
        result[date].budget_incomes[mainTag].transactions.push(tr)
      )
    }
    if (type === TrType.outcome) {
      result[date].budget_outcomes[mainTag] ??= makeAccumulatedNode()
      result[date].budget_outcomes[mainTag].amount[tr.outcomeInstrument] ??= 0
      result[date].budget_outcomes[mainTag].amount[tr.outcomeInstrument] = sub(
        tr.outcome,
        result[date].budget_outcomes[mainTag].transactions.push(tr)
      )
    }
    if (type === TrType.incomeDebt) {
      if (tr.merchant) {
      }
    }
    if (type === TrType.transfer) {
    }
  })

  function addToTotal(
    acc: TMonthInfo,
    tr: TRawTransaction,
    inBudgetAccs: TAccountId[]
  ): void {
    if (inBudgetAccs.includes(tr.incomeAccount)) {
      acc.budget_total[tr.incomeInstrument] ??= 0
      acc.budget_total[tr.incomeInstrument] = add(
        acc.budget_total[tr.incomeInstrument],
        tr.income
      )
    }
    if (inBudgetAccs.includes(tr.outcomeAccount)) {
      acc.budget_total[tr.outcomeInstrument] ??= 0
      acc.budget_total[tr.outcomeInstrument] = sub(
        acc.budget_total[tr.outcomeInstrument],
        tr.outcome
      )
    }
  }

  return result
}

function getTrMonth(tr: TRawTransaction): TMonthInfo['date'] {
  return new Date(tr.date).toISOString().slice(0, 7)
}

function getMainTag(tr: TRawTransaction): TTagId | null {
  return tr.tag?.[0] || null
}

function isInBudget(tr: TRawTransaction, inBudgetAccs: TAccountId[]): boolean {
  return (
    inBudgetAccs.includes(tr.incomeAccount) ||
    inBudgetAccs.includes(tr.outcomeAccount)
  )
}
