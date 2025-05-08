import { useMemo } from 'react'
import {
  AccountType,
  ByDate,
  TAccountId,
  TFxAmount,
  TISODate,
  TTransaction,
} from '6-shared/types'
import { addFxAmount } from '6-shared/helpers/money'
import { GroupBy, makeDateArray, toGroup } from '6-shared/helpers/date'

import { useAppSelector } from 'store/index'
import { accountModel } from '5-entities/account'
import { instrumentModel, TInstCodeMap } from '5-entities/currency/instrument'
import { displayCurrency } from '5-entities/currency/displayCurrency'
import { trModel, TrType } from '5-entities/transaction'
import { Period, getStart } from './period'

export type TCashflowPoint = {
  date: TISODate
  debts: number
  income: number
  outcome: number
  outcomeInBalance: number
  outcomeOutOfBalance: number
  transfers: number
}

type Account = {
  inBudget?: boolean
  type?: AccountType
  [key: string]: any
}

export type StatSummary = {
  totalIncome: number
  totalOutcomeInBalance: number
  totalOutcomeOutOfBalance: number
  totalSavings: number
  savingsRate: number
}

export function useStatSummary(period: Period): StatSummary {
  const points = useCashFlow(period, GroupBy.Day)

  const {totalIncome, totalOutcomeInBalance, totalOutcomeOutOfBalance}
    = points.reduce((acc, point, index) => {
      // We skip the first point because we need to get the total
      // for the whole period, but not period + 1 day
      if (index === 0) return acc
      return {
        totalIncome: acc.totalIncome + point.income,
        totalOutcomeInBalance: acc.totalOutcomeInBalance + Math.abs(point.outcomeInBalance),
        totalOutcomeOutOfBalance: acc.totalOutcomeOutOfBalance + Math.abs(point.outcomeOutOfBalance)
      }
    },
    {totalIncome: 0, totalOutcomeInBalance: 0, totalOutcomeOutOfBalance: 0}
  )

  const totalSavings = totalIncome - totalOutcomeInBalance - totalOutcomeOutOfBalance
  const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0

  return {
    totalIncome,
    totalOutcomeInBalance,
    totalOutcomeOutOfBalance,
    totalSavings,
    savingsRate
  }
}

export function useCashFlow(
  period: Period,
  aggregation: GroupBy = GroupBy.Month
): TCashflowPoint[] {
  const transactionHistory = trModel.useTransactionsHistory()
  const debtAccId = accountModel.useDebtAccountId()
  const instCodeMap = instrumentModel.useInstCodeMap()
  const accounts = accountModel.usePopulatedAccounts() as Record<string, Account>
  const aggregatedNodes = useMemo(
    () => calcCashflow(transactionHistory, debtAccId, instCodeMap, accounts, aggregation),
    [aggregation, debtAccId, instCodeMap, transactionHistory]
  )

  const toDisplay = displayCurrency.useToDisplay('current')
  const historyStart = useAppSelector(trModel.getHistoryStart)
  const firstDate = getStartDate(period, aggregation, historyStart)

  return makeDateArray(firstDate, Date.now(), aggregation)
    .map(date => aggregatedNodes[date] || makePoint(date))
    .map(p => {
      const outcomeInBalance = -toDisplay(p.outcomeInBalance)
      const outcomeOutOfBalance = -toDisplay(p.outcomeOutOfBalance)

      return {
        date: p.date,
        debts: toDisplay(p.debts),
        income: toDisplay(p.income),
        outcome: outcomeInBalance + outcomeOutOfBalance,
        outcomeInBalance: outcomeInBalance,
        outcomeOutOfBalance: outcomeOutOfBalance,
        transfers: toDisplay(p.transfers),
      }
    })
}

function getStartDate(
  period: Period,
  aggregation: GroupBy,
  historyStart?: TISODate
): TISODate {
  if (!historyStart) return toGroup(Date.now(), aggregation)
  const historyStartGroup = toGroup(historyStart, aggregation)
  const periodStart = getStart(period, aggregation)
  if (!periodStart) return historyStartGroup
  return historyStartGroup > periodStart ? historyStartGroup : periodStart
}

function calcCashflow(
  transactions: TTransaction[],
  debtAccId: TAccountId | undefined,
  instCodeMap: TInstCodeMap,
  accounts: Record<string, Account>,
  aggregation: GroupBy = GroupBy.Month
) : ByDate<TPoint> {
  let result: ByDate<TPoint> = {}

  transactions.forEach(tr => {
    const group = toGroup(tr.date, aggregation)
    if (!result[group]) result[group] = makePoint(group)

    const type = trModel.getType(tr, debtAccId)
    const incomeCurrency = instCodeMap[tr.incomeInstrument]
    const outcomeCurrency = instCodeMap[tr.outcomeInstrument]
    switch (type) {
      case TrType.Income:
        result[group].income = addFxAmount(result[group].income, {
          [incomeCurrency]: tr.income,
        })
        return

      case TrType.Outcome:
        const account = accounts[tr.outcomeAccount]
        if (account?.inBudget) {
          result[group].outcomeInBalance = addFxAmount(result[group].outcomeInBalance, {
            [outcomeCurrency]: -tr.outcome,
          })
        } else {
          result[group].outcomeOutOfBalance = addFxAmount(result[group].outcomeOutOfBalance, {
            [outcomeCurrency]: -tr.outcome,
          })
        }
        return

      case TrType.IncomeDebt:
        result[group].debts = addFxAmount(result[group].debts, {
          [incomeCurrency]: tr.income,
        })
        return

      case TrType.OutcomeDebt:
        result[group].debts = addFxAmount(result[group].debts, {
          [outcomeCurrency]: -tr.outcome,
        })
        return

      case TrType.Transfer:
        result[group].transfers = addFxAmount(
          result[group].transfers,
          { [incomeCurrency]: tr.income },
          { [outcomeCurrency]: -tr.outcome }
        )
        return

      default:
        throw new Error('Unknown type')
    }
  })

  return result
}

type TPoint = {
  date: TISODate
  debts: TFxAmount
  income: TFxAmount
  outcomeInBalance: TFxAmount
  outcomeOutOfBalance: TFxAmount
  transfers: TFxAmount
}

function makePoint(date: TISODate): TPoint {
  return {
    date,
    debts: {},
    income: {},
    outcomeInBalance: {},
    outcomeOutOfBalance: {},
    transfers: {},
  }
}
