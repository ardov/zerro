import { createSelector } from '@reduxjs/toolkit'
import {
  ById,
  TAccountId,
  TFxAmount,
  TISODate,
  TTransactionId,
} from '@shared/types'

import { TSelector } from '@store/index'
import { getTransactionsHistory, getType, TrType } from '@entities/transaction'
import { instrumentModel } from '@entities/currency/instrument'
import { debtorModel } from '@entities/debtors'
import { accountModel } from '@entities/account'
import { withPerf } from '@shared/helpers/performance'

export type TTrEffect = {
  id: TTransactionId
  date: TISODate
  accounts?: Record<TAccountId, TFxAmount>
  debtors?: Record<string, TFxAmount>
}

/**
 * Returns an array of balance changes created for every transaction from transaction history
 */
export const getBalanceChanges: TSelector<ById<TTrEffect>> = createSelector(
  [
    getTransactionsHistory,
    accountModel.getDebtAccountId,
    debtorModel.detector,
    instrumentModel.getInstCodeMap,
  ],
  withPerf(
    'getBalanceChanges',
    (transactions, debtId, getDebtorId, instCodeMap) => {
      let result: ById<TTrEffect> = {}
      transactions.forEach(tr => {
        const { id, incomeAccount, outcomeAccount, income, outcome, date } = tr
        const type = getType(tr, debtId)
        const incomeCurrency = instCodeMap[tr.incomeInstrument]
        const outcomeCurrency = instCodeMap[tr.outcomeInstrument]
        switch (type) {
          case TrType.Income:
            result[id] = {
              id,
              date,
              accounts: {
                [incomeAccount]: { [incomeCurrency]: income },
              },
            }
            return

          case TrType.Outcome:
            result[id] = {
              id,
              date,
              accounts: {
                [outcomeAccount]: { [outcomeCurrency]: -outcome },
              },
            }
            return

          case TrType.Transfer:
            result[id] = {
              id,
              date,
              accounts: {
                [incomeAccount]: { [incomeCurrency]: income },
                [outcomeAccount]: { [outcomeCurrency]: -outcome },
              },
            }
            return

          case TrType.IncomeDebt:
            result[id] = {
              id,
              date,
              accounts: {
                [incomeAccount]: { [incomeCurrency]: income },
              },
              debtors: {
                [getDebtorId(tr)]: { [outcomeCurrency]: -outcome },
              },
            }
            return

          case TrType.OutcomeDebt:
            result[id] = {
              id,
              date,
              accounts: {
                [outcomeAccount]: { [outcomeCurrency]: -outcome },
              },
              debtors: {
                [getDebtorId(tr)]: { [incomeCurrency]: income },
              },
            }
            return

          default:
            throw new Error('Unknown type')
        }
      })
      return result
    }
  )
)
