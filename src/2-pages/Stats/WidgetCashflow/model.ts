import { useMemo } from 'react'
import {
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
import { Period, getStart } from '../shared/period'

type TPoint = {
  date: TISODate
  debts: TFxAmount
  income: TFxAmount
  outcome: TFxAmount
  transfers: TFxAmount
}

// Hook
export function useCashFlow(
  period: Period,
  aggregation: GroupBy = GroupBy.Month
) {
  const transactionHistory = trModel.useTransactionsHistory()
  const debtAccId = accountModel.useDebtAccountId()
  const instCodeMap = instrumentModel.useInstCodeMap()
  const aggregatedNodes = useMemo(
    () => calcCashflow(transactionHistory, debtAccId, instCodeMap, aggregation),
    [aggregation, debtAccId, instCodeMap, transactionHistory]
  )

  const toDisplay = displayCurrency.useToDisplay('current')
  const historyStart = useAppSelector(trModel.getHistoryStart)
  const firstDate = getStartDate(period, aggregation, historyStart)

  const points = makeDateArray(firstDate, Date.now(), aggregation)
    .map(date => aggregatedNodes[date] || makePoint(date))
    .map(p => ({
      date: p.date,
      debts: toDisplay(p.debts),
      income: toDisplay(p.income),
      outcome: -toDisplay(p.outcome),
      transfers: toDisplay(p.transfers),
    }))

  return points
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
  aggregation: GroupBy = GroupBy.Month
) {
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
        result[group].outcome = addFxAmount(result[group].outcome, {
          [outcomeCurrency]: -tr.outcome,
        })
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

function makePoint(date: TISODate): TPoint {
  return {
    date,
    debts: {},
    income: {},
    outcome: {},
    transfers: {},
  }
}
