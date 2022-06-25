import { add, sub } from 'shared/helpers/currencyHelpers'
import { getType } from 'models/data/transactions/helpers'
import {
  TAccountId,
  TInstrumentId,
  TMerchantId,
  TTagId,
  TRawTransaction,
  TrType,
} from 'shared/types'

type TFxAmount = {
  [currency: TInstrumentId]: number
}

type TAccumulated = {
  amount: TFxAmount
  transactions: TRawTransaction[]
}

type TMonthInfo = {
  date: string // YYYY-MM
  total: TFxAmount
  incomes: Record<TTagId, TAccumulated>
  outcomes: Record<TTagId, TAccumulated>
  payeeDebts: { [payee: string]: TAccumulated }
  merchantDebts: Record<TMerchantId, TAccumulated>
  transfers: Record<TAccountId, TAccumulated>
  transferFees: TAccumulated
}

export type TMoneyFlowByMonth = {
  [month: string]: TMonthInfo
}

const makeAccumulatedNode = (): TAccumulated => ({
  amount: {},
  transactions: [],
})

const makeMonthInfo = (date: TMonthInfo['date']): TMonthInfo => ({
  date,
  total: {},
  incomes: {},
  outcomes: {},
  payeeDebts: {},
  merchantDebts: {},
  transfers: {},
  transferFees: makeAccumulatedNode(),
})

export function getRealMoneyFlow(
  transactions: TRawTransaction[],
  inBudgetAccIds: TAccountId[],
  debtAccId?: TAccountId
): TMoneyFlowByMonth {
  const result: TMoneyFlowByMonth = {}

  transactions.forEach(tr => {
    if (!isInBudget(tr, inBudgetAccIds)) return
    const date = getTrMonth(tr)
    const type = getType(tr, debtAccId)
    const mainTag = getMainTag(tr) || 'null'
    let month = (result[date] ??= makeMonthInfo(date))
    addToTotal(month, tr, inBudgetAccIds)

    if (type === TrType.income) {
      let acc = (month.incomes[mainTag] ??= makeAccumulatedNode())
      addToAccumulated(acc, tr, 'income')
    }
    if (type === TrType.outcome) {
      let acc = (month.outcomes[mainTag] ??= makeAccumulatedNode())
      addToAccumulated(acc, tr, 'outcome')
    }
    if (type === TrType.incomeDebt) {
      if (tr.merchant) {
        let acc = (month.merchantDebts[tr.merchant] ??= makeAccumulatedNode())
        addToAccumulated(acc, tr, 'income')
      } else if (tr.payee) {
        let acc = (month.payeeDebts[tr.payee] ??= makeAccumulatedNode())
        addToAccumulated(acc, tr, 'income')
      } else {
        throw new Error("Transaction doesn't have payee or merchant")
      }
    }
    if (type === TrType.outcomeDebt) {
      if (tr.merchant) {
        let acc = (month.merchantDebts[tr.merchant] ??= makeAccumulatedNode())
        addToAccumulated(acc, tr, 'outcome')
      } else if (tr.payee) {
        let acc = (month.payeeDebts[tr.payee] ??= makeAccumulatedNode())
        addToAccumulated(acc, tr, 'outcome')
      } else {
        throw new Error("Transaction doesn't have payee or merchant")
      }
    }
    if (type === TrType.transfer) {
      if (
        inBudgetAccIds.includes(tr.incomeAccount) &&
        inBudgetAccIds.includes(tr.outcomeAccount)
      ) {
        // Inner transfer
        addToAccumulated(month.transferFees, tr, 'income')
        addToAccumulated(month.transferFees, tr, 'outcome')
      } else if (inBudgetAccIds.includes(tr.incomeAccount)) {
        // Income transfer
        let acc = (month.transfers[tr.incomeAccount] ??= makeAccumulatedNode())
        addToAccumulated(acc, tr, 'income')
      } else if (inBudgetAccIds.includes(tr.outcomeAccount)) {
        // Outcome transfer
        let acc = (month.transfers[tr.outcomeAccount] ??= makeAccumulatedNode())
        addToAccumulated(acc, tr, 'outcome')
      }
    }
  })

  function addToTotal(
    acc: TMonthInfo,
    tr: TRawTransaction,
    inBudgetAccs: TAccountId[]
  ): void {
    if (inBudgetAccs.includes(tr.incomeAccount)) {
      acc.total[tr.incomeInstrument] ??= 0
      acc.total[tr.incomeInstrument] = add(
        acc.total[tr.incomeInstrument],
        tr.income
      )
    }
    if (inBudgetAccs.includes(tr.outcomeAccount)) {
      acc.total[tr.outcomeInstrument] ??= 0
      acc.total[tr.outcomeInstrument] = sub(
        acc.total[tr.outcomeInstrument],
        tr.outcome
      )
    }
  }

  function addToAccumulated(
    acc: TAccumulated,
    tr: TRawTransaction,
    mode: 'income' | 'outcome'
  ) {
    const instrument = tr[`${mode}Instrument`]
    const amount = mode === 'income' ? tr.income : -tr.outcome
    acc.amount[instrument] ??= 0
    acc.amount[instrument] = add(acc.amount[instrument], amount)
    acc.transactions.push(tr)
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