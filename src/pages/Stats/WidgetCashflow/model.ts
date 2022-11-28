import { TAccountId, TFxAmount, TISODate, TTransaction } from '@shared/types'
import { addFxAmount } from '@shared/helpers/money'
import { makeDateArray, toISODate } from '@shared/helpers/date'
import { keys } from '@shared/helpers/keys'

import { useAppSelector } from '@store/index'
import { accountModel } from '@entities/account'
import { instrumentModel, TInstCodeMap } from '@entities/currency/instrument'
import { displayCurrency } from '@entities/currency/displayCurrency'
import { getTransactionsHistory, getType, TrType } from '@entities/transaction'

type TPoint = {
  date: TISODate
  debts: TFxAmount
  income: TFxAmount
  outcome: TFxAmount
  transfers: TFxAmount
}

export enum Period {
  LastYear = 'LastYear',
  ThreeYears = 'ThreeYears',
  All = 'All',
}

export enum GroupBy {
  Day = 'Day',
  Month = 'Month',
  Year = 'Year',
}

export function calcCashflow(
  transactions: TTransaction[],
  debtAccId: TAccountId | undefined,
  instCodeMap: TInstCodeMap,
  aggregation: GroupBy = GroupBy.Month
) {
  let result: Record<TISODate, TPoint> = {}

  transactions.forEach(tr => {
    const group = getGroup(tr.date, aggregation)
    if (!result[group]) result[group] = makePoint(group)

    const type = getType(tr, debtAccId)
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

function getGroup(date: TISODate, aggregation: GroupBy): TISODate {
  if (aggregation === GroupBy.Year) {
    return (date.slice(0, 4) + '-01-01') as TISODate
  }
  if (aggregation === GroupBy.Month) {
    return (date.slice(0, 7) + '-01') as TISODate
  }
  return date
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
  const transactionHistory = useAppSelector(getTransactionsHistory)
  const debtAccId = accountModel.useDebtAccountId()
  const instCodeMap = instrumentModel.useInstCodeMap()

  const firstDate = getStart(period, aggregation)

  const cashflowNodes = calcCashflow(
    transactionHistory.filter(tr => tr.date >= firstDate),
    debtAccId,
    instCodeMap,
    aggregation
  )

  let first = keys(cashflowNodes).sort()[0]

  const points = makeDateArray(first)
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

function getStart(period: Period, aggregation: GroupBy) {
  if (period === Period.All) return '2000-01-01' as TISODate
  if (period === Period.LastYear) {
    const date = new Date()
    date.setFullYear(date.getFullYear() - 1)
    return getGroup(toISODate(date), aggregation)
  }
  if (period === Period.ThreeYears) {
    const date = new Date()
    date.setFullYear(date.getFullYear() - 3)
    return getGroup(toISODate(date), aggregation)
  }
  throw new Error('Unknown period: ', period)
}
