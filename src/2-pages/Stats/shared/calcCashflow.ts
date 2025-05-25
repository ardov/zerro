import { TInstCodeMap } from '5-entities/currency/instrument'
import { trModel, TrType } from '5-entities/transaction'
import { GroupBy, toGroup } from '6-shared/helpers/date'
import { addFxAmount } from '6-shared/helpers/money'
import {
  TTransaction,
  TAccountId,
  ByDate,
  TISODate,
  TFxAmount,
  AccountType,
} from '6-shared/types'

type Account = {
  inBudget?: boolean
  type?: AccountType
  [key: string]: any
}

type TPoint = {
  date: TISODate
  debts: TFxAmount
  income: TFxAmount
  outcomeInBalance: TFxAmount
  outcomeOutOfBalance: TFxAmount
  transfers: TFxAmount
}

/**
 * Calculates the cashflow for a given period, aggregated by time groups.
 * Returns a map of date groups to cashflow points containing income, outcome,
 * transfers and debt movements in their original currencies.
 */
export function calcCashflow(
  transactions: TTransaction[],
  debtAccId: TAccountId | undefined,
  instCodeMap: TInstCodeMap,
  accounts: Record<string, Account>,
  aggregation: GroupBy = GroupBy.Month
): ByDate<TPoint> {
  let result: ByDate<TPoint> = {}

  transactions.forEach(tr => {
    const group = toGroup(tr.date, aggregation)
    if (!result[group])
      result[group] = {
        date: group,
        debts: {},
        income: {},
        outcomeInBalance: {},
        outcomeOutOfBalance: {},
        transfers: {},
      }

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
          result[group].outcomeInBalance = addFxAmount(
            result[group].outcomeInBalance,
            { [outcomeCurrency]: -tr.outcome }
          )
        } else {
          result[group].outcomeOutOfBalance = addFxAmount(
            result[group].outcomeOutOfBalance,
            { [outcomeCurrency]: -tr.outcome }
          )
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
