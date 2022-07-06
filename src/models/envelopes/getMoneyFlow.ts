import { add, sub } from 'shared/helpers/currencyHelpers'
import { getType } from 'models/transaction/helpers'
import {
  DataEntity,
  TAccountId,
  TISOMonth,
  TTagId,
  ITransaction,
} from 'shared/types'
import { toISOMonth } from 'shared/helpers/date'
import { TFxAmount } from './helpers/fxAmount'
import { getTransactionsHistory, TrType } from 'models/transaction'

import { getDebtAccountId, getInBudgetAccounts } from 'models/account'
import { getEnvelopeId, TEnvelopeId } from 'models/shared/envelopeHelpers'
import { cleanPayee } from 'models/shared/cleanPayee'
import { createSelector } from '@reduxjs/toolkit'
import { TSelector } from 'store'
import { keys } from 'shared/helpers/keys'

type TEnvelopeNode = {
  income: TFxAmount
  outcome: TFxAmount
  incomeTransactions: ITransaction[]
  outcomeTransactions: ITransaction[]
}

type TMonthInfo = {
  date: TISOMonth
  balanceChange: TFxAmount
  balanceStart: TFxAmount
  balanceEnd: TFxAmount
  transferFees: TFxAmount
  transferFeesTransactions: ITransaction[]
  envelopes: Record<TEnvelopeId, TEnvelopeNode>
}

const getCurrentBalance = createSelector([getInBudgetAccounts], accounts =>
  accounts.reduce((total, account) => {
    total[account.instrument] ??= 0
    total[account.instrument] = add(total[account.instrument], account.balance)
    return total
  }, {} as TFxAmount)
)

export const getMoneyFlow: TSelector<Record<TISOMonth, TMonthInfo>> =
  createSelector(
    [getTransactionsHistory, getInBudgetAccounts, getDebtAccountId],
    (
      transactions,
      accountsInBudget,
      debtAccId
    ): Record<TISOMonth, TMonthInfo> => {
      const result: Record<TISOMonth, TMonthInfo> = {}
      const inBudgetAccIds = accountsInBudget.map(acc => acc.id)

      transactions.forEach(tr => {
        if (!isInBudget(tr, inBudgetAccIds)) return
        const date = getTrMonth(tr)
        const type = getType(tr, debtAccId)
        let month = (result[date] ??= makeMonthInfo(date))

        // TAG INCOME
        if (type === TrType.Income) {
          let envelopeId = getEnvelopeId(DataEntity.Tag, getMainTag(tr))
          addToMonth(month, envelopeId, tr, 'income')
          return
        }

        // TAG OUTCOME
        if (type === TrType.Outcome) {
          let envelopeId = getEnvelopeId(DataEntity.Tag, getMainTag(tr))
          addToMonth(month, envelopeId, tr, 'outcome')
          return
        }

        if (type === TrType.IncomeDebt) {
          // MERCHANT INCOME
          if (tr.merchant) {
            let envelopeId = getEnvelopeId(DataEntity.Merchant, tr.merchant)
            addToMonth(month, envelopeId, tr, 'income')
            return
          }

          // PAYEE INCOME
          if (tr.payee) {
            let envelopeId = getEnvelopeId('payee', cleanPayee(tr.payee))
            addToMonth(month, envelopeId, tr, 'income')
            return
          }

          throw new Error("Transaction doesn't have payee or merchant")
        }

        if (type === TrType.OutcomeDebt) {
          // MERCHANT OUTCOME
          if (tr.merchant) {
            let envelopeId = getEnvelopeId(DataEntity.Merchant, tr.merchant)
            addToMonth(month, envelopeId, tr, 'outcome')
            return
          }

          // PAYEE OUTCOME
          if (tr.payee) {
            let envelopeId = getEnvelopeId('payee', cleanPayee(tr.payee))
            addToMonth(month, envelopeId, tr, 'outcome')
            return
          }

          throw new Error("Transaction doesn't have payee or merchant")
        }

        if (type === TrType.Transfer) {
          // INNER TRANSFER (check for fees)
          if (isTransferInsideBudget(tr, inBudgetAccIds)) {
            // Skip transactions that doesn't affect budget
            if (sameAmountAndCurrency(tr)) return

            month.transferFees[tr.incomeInstrument] ??= 0
            month.transferFees[tr.incomeInstrument] = add(
              month.transferFees[tr.incomeInstrument],
              tr.income
            )
            month.transferFees[tr.outcomeInstrument] ??= 0
            month.transferFees[tr.outcomeInstrument] = sub(
              month.transferFees[tr.outcomeInstrument],
              tr.outcome
            )
            month.transferFeesTransactions.push(tr)
            return
          }

          // ACCOUNT INCOME
          if (inBudgetAccIds.includes(tr.incomeAccount)) {
            let envelopeId = getEnvelopeId(DataEntity.Account, tr.incomeAccount)
            addToMonth(month, envelopeId, tr, 'income')
            return
          }

          // ACCOUNT OUTCOME
          if (inBudgetAccIds.includes(tr.outcomeAccount)) {
            let envelopeId = getEnvelopeId(
              DataEntity.Account,
              tr.outcomeAccount
            )
            addToMonth(month, envelopeId, tr, 'outcome')
            return
          }
        }
      })

      console.log('Sorted keys', keys(result).sort())

      return result
    }
  )

function addToMonth(
  month: TMonthInfo,
  id: TEnvelopeId,
  tr: ITransaction,
  mode: 'income' | 'outcome'
) {
  const instrument = tr[`${mode}Instrument`]
  const amount = mode === 'income' ? tr.income : -tr.outcome
  // Add to envelope
  let acc = (month.envelopes[id] ??= makeEnvelopeNode())
  acc[mode][instrument] ??= 0
  acc[mode][instrument] = add(acc[mode][instrument], amount)
  acc[`${mode}Transactions`].push(tr)
  // Add to total change
  month.balanceChange[instrument] ??= 0
  month.balanceChange[instrument] = add(month.balanceChange[instrument], amount)
}

function makeMonthInfo(date: TMonthInfo['date']): TMonthInfo {
  return {
    date,
    balanceChange: {},
    balanceStart: {},
    balanceEnd: {},
    transferFees: {},
    transferFeesTransactions: [],
    envelopes: {},
  }
}

function makeEnvelopeNode(): TEnvelopeNode {
  return {
    income: {},
    outcome: {},
    incomeTransactions: [],
    outcomeTransactions: [],
  }
}

function sameAmountAndCurrency(tr: ITransaction) {
  return (
    tr.income === tr.outcome && tr.incomeInstrument === tr.outcomeInstrument
  )
}
function isTransferInsideBudget(
  tr: ITransaction,
  inBudgetAccounts: TAccountId[]
) {
  return (
    inBudgetAccounts.includes(tr.incomeAccount) &&
    inBudgetAccounts.includes(tr.outcomeAccount)
  )
}

function getTrMonth(tr: ITransaction): TMonthInfo['date'] {
  return toISOMonth(tr.date)
}

function getMainTag(tr: ITransaction): TTagId {
  return tr.tag?.[0] || 'null'
}

function isInBudget(tr: ITransaction, inBudgetAccs: TAccountId[]): boolean {
  return (
    inBudgetAccs.includes(tr.incomeAccount) ||
    inBudgetAccs.includes(tr.outcomeAccount)
  )
}
