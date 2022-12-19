import { TAccountId, TFxAmount, TISODate, TTransaction } from '@shared/types'
import { addFxAmount } from '@shared/helpers/money'
import { GroupBy, makeDateArray, toGroup } from '@shared/helpers/date'
import { keys } from '@shared/helpers/keys'

import { accountModel } from '@entities/account'
import { instrumentModel, TInstCodeMap } from '@entities/currency/instrument'
import { displayCurrency } from '@entities/currency/displayCurrency'
import { trModel, TrType } from '@entities/transaction'
import { Period, getStart } from '../shared/period'
import { useMemo } from 'react'

type TPoint = {
  date: TISODate
  debts: TFxAmount
  income: TFxAmount
  outcome: TFxAmount
  transfers: TFxAmount
}

export function calcCashflow(
  transactions: TTransaction[],
  debtAccId: TAccountId | undefined,
  instCodeMap: TInstCodeMap,
  aggregation: GroupBy = GroupBy.Month
) {
  let result: Record<TISODate, TPoint> = {}

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

// Hook

export function useCashFlow(
  period: Period,
  aggregation: GroupBy = GroupBy.Month
) {
  const toDisplay = displayCurrency.useToDisplay('current')
  const transactionHistory = trModel.useTransactionsHistory()
  const debtAccId = accountModel.useDebtAccountId()
  const instCodeMap = instrumentModel.useInstCodeMap()

  const cashflowNodes = useMemo(
    () => calcCashflow(transactionHistory, debtAccId, instCodeMap, aggregation),
    [aggregation, debtAccId, instCodeMap, transactionHistory]
  )

  const firstData = keys(cashflowNodes).sort()[0]
  const firstPeriod = getStart(period, aggregation) || '2000-01-01'
  const firstDate = firstData > firstPeriod ? firstData : firstPeriod

  const points = makeDateArray(firstDate)
    .map(date => {
      return cashflowNodes[date] || makePoint(date)
    })
    .map(p => {
      return {
        date: p.date,
        debts: toDisplay(p.debts),
        income: toDisplay(p.income),
        outcome: -toDisplay(p.outcome),
        transfers: toDisplay(p.transfers),
      }
    })

  return points
}
