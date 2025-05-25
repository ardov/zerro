import { useMemo } from 'react'
import { TISODate } from '6-shared/types'
import { GroupBy, makeDateArray, toGroup } from '6-shared/helpers/date'

import { useAppSelector } from 'store/index'
import { accountModel } from '5-entities/account'
import { instrumentModel } from '5-entities/currency/instrument'
import { displayCurrency } from '5-entities/currency/displayCurrency'
import { trModel } from '5-entities/transaction'
import { Period, getStart } from './period'
import { calcCashflow } from './calcCashflow'

export type TCashflowPoint = {
  date: TISODate
  debts: number
  income: number
  outcome: number
  outcomeInBalance: number
  outcomeOutOfBalance: number
  transfers: number
}

export function summarizeCashflow(points: TCashflowPoint[]) {
  let debts = 0
  let income = 0
  let outcome = 0
  let outcomeInBalance = 0
  let outcomeOutOfBalance = 0
  let transfers = 0

  points.forEach(point => {
    debts += point.debts
    income += point.income
    outcome += point.outcome
    outcomeInBalance += point.outcomeInBalance
    outcomeOutOfBalance += point.outcomeOutOfBalance
    transfers += point.transfers
  })

  return {
    debts,
    income,
    outcome,
    outcomeInBalance,
    outcomeOutOfBalance,
    transfers,
  }
}

export function useCashFlow(
  period: Period,
  aggregation: GroupBy = GroupBy.Month
): TCashflowPoint[] {
  const transactionHistory = trModel.useTransactionsHistory()
  const debtAccId = accountModel.useDebtAccountId()
  const instCodeMap = instrumentModel.useInstCodeMap()
  const accounts = accountModel.usePopulatedAccounts()
  const aggregatedNodes = useMemo(
    () =>
      calcCashflow(
        transactionHistory,
        debtAccId,
        instCodeMap,
        accounts,
        aggregation
      ),
    [aggregation, debtAccId, instCodeMap, transactionHistory]
  )

  const toDisplay = displayCurrency.useToDisplay('current')
  const historyStart = useAppSelector(trModel.getHistoryStart)
  const firstDate = getStartDate(period, aggregation, historyStart)

  return makeDateArray(firstDate, Date.now(), aggregation).map(date => {
    const point = aggregatedNodes[date] || {
      date,
      debts: {},
      income: {},
      outcomeInBalance: {},
      outcomeOutOfBalance: {},
      transfers: {},
    }
    const outcomeInBalance = -toDisplay(point.outcomeInBalance)
    const outcomeOutOfBalance = -toDisplay(point.outcomeOutOfBalance)
    return {
      date,
      debts: toDisplay(point.debts),
      income: toDisplay(point.income),
      outcome: outcomeInBalance + outcomeOutOfBalance,
      outcomeInBalance: outcomeInBalance,
      outcomeOutOfBalance: outcomeOutOfBalance,
      transfers: toDisplay(point.transfers),
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
