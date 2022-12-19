import { createSelector } from '@reduxjs/toolkit'
import {
  TAccountId,
  TFxAmount,
  TISODate,
  TTransaction,
  TTransactionId,
} from '@shared/types'
import { trModel, TrType } from '@entities/transaction'
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

export const getConverterToChange = createSelector(
  [
    accountModel.getDebtAccountId,
    debtorModel.detector,
    instrumentModel.getInstCodeMap,
  ],
  withPerf('getConverterToChange', (debtId, getDebtorId, instCodeMap) => {
    return (tr: TTransaction) => {
      const { id, incomeAccount, outcomeAccount, income, outcome, date } = tr
      const type = trModel.getType(tr, debtId)
      const incomeFx = instCodeMap[tr.incomeInstrument]
      const outcomeFx = instCodeMap[tr.outcomeInstrument]
      let effect: TTrEffect = { id, date }

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
          effect.debtors = { [getDebtorId(tr)]: { [outcomeFx]: -outcome } }
          break

        case TrType.OutcomeDebt:
          effect.accounts = { [outcomeAccount]: { [outcomeFx]: -outcome } }
          effect.debtors = { [getDebtorId(tr)]: { [incomeFx]: income } }
          break

        default:
          throw new Error('Unknown type ' + type)
      }
      return effect
    }
  })
)
