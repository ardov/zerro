import { add } from 'shared/helpers/currencyHelpers'
import { getType } from 'models/transaction/helpers'
import {
  DataEntity,
  TAccountId,
  TISOMonth,
  TTagId,
  ITransaction,
  ById,
} from 'shared/types'
import { toISOMonth } from 'shared/helpers/date'
import { TInstAmount } from '../helpers/fxAmount'
import { getTransactionsHistory, TrType } from 'models/transaction'
import { getDebtAccountId, getInBudgetAccounts } from 'models/account'
import { getEnvelopeId, TEnvelopeId } from 'models/shared/envelopeHelpers'
import { cleanPayee } from 'models/shared/cleanPayee'
import { createSelector } from '@reduxjs/toolkit'
import { TSelector } from 'store'
import { keys } from 'shared/helpers/keys'
import { getEnvelopes, IEnvelope } from './envelopes'

export type TEnvelopeNode = {
  activity: TInstAmount
  transactions: ITransaction[]
}

export type TMonthActivity = {
  date: TISOMonth
  /** Total balance change of in budget accounts */
  totalActivity: TInstAmount
  /** Unsorted income from envelopes */
  generalIncome: TEnvelopeNode
  /** Transfer fees activity (also includes currency exchange) */
  transferFees: TEnvelopeNode
  /** Activity by envelope */
  envelopes: Record<TEnvelopeId, TEnvelopeNode>
}

export const getActivity: TSelector<Record<TISOMonth, TMonthActivity>> =
  createSelector(
    [
      getTransactionsHistory,
      getInBudgetAccounts,
      getDebtAccountId,
      getEnvelopes,
    ],
    (
      transactions,
      accountsInBudget,
      debtAccId,
      envelopes
    ): Record<TISOMonth, TMonthActivity> => {
      const result: Record<TISOMonth, TMonthActivity> = {}
      const inBudgetAccIds = accountsInBudget.map(acc => acc.id)

      transactions.forEach(tr => {
        if (!isInBudget(tr, inBudgetAccIds)) return
        const date = getTrMonth(tr)
        const type = getType(tr, debtAccId)
        let node = (result[date] ??= makeMonthInfo(date))

        // TAG INCOME
        if (type === TrType.Income) {
          let envelopeId = getEnvelopeId(DataEntity.Tag, getMainTag(tr))
          addToMonth(node, envelopeId, tr, 'income', envelopes)
          return
        }

        // TAG OUTCOME
        if (type === TrType.Outcome) {
          let envelopeId = getEnvelopeId(DataEntity.Tag, getMainTag(tr))
          addToMonth(node, envelopeId, tr, 'outcome', envelopes)
          return
        }

        if (type === TrType.IncomeDebt) {
          // MERCHANT INCOME
          if (tr.merchant) {
            let envelopeId = getEnvelopeId(DataEntity.Merchant, tr.merchant)
            addToMonth(node, envelopeId, tr, 'income', envelopes)
            return
          }

          // PAYEE INCOME
          if (tr.payee) {
            let envelopeId = getEnvelopeId('payee', cleanPayee(tr.payee))
            addToMonth(node, envelopeId, tr, 'income', envelopes)
            return
          }

          throw new Error("Transaction doesn't have payee or merchant")
        }

        if (type === TrType.OutcomeDebt) {
          // MERCHANT OUTCOME
          if (tr.merchant) {
            let envelopeId = getEnvelopeId(DataEntity.Merchant, tr.merchant)
            addToMonth(node, envelopeId, tr, 'outcome', envelopes)
            return
          }

          // PAYEE OUTCOME
          if (tr.payee) {
            let envelopeId = getEnvelopeId('payee', cleanPayee(tr.payee))
            addToMonth(node, envelopeId, tr, 'outcome', envelopes)
            return
          }

          throw new Error("Transaction doesn't have payee or merchant")
        }

        if (type === TrType.Transfer) {
          // INNER TRANSFER (check for fees)
          if (isTransferInsideBudget(tr, inBudgetAccIds)) {
            // Skip transactions that doesn't affect budget
            if (sameAmountAndCurrency(tr)) return

            // Add to transfer fees
            node.transferFees.activity[tr.incomeInstrument] = add(
              node.transferFees.activity[tr.incomeInstrument] || 0,
              tr.income
            )
            node.transferFees.activity[tr.outcomeInstrument] = add(
              node.transferFees.activity[tr.outcomeInstrument] || 0,
              -tr.outcome
            )
            node.transferFees.transactions.push(tr)
            return
          }

          // ACCOUNT INCOME
          if (inBudgetAccIds.includes(tr.incomeAccount)) {
            let envelopeId = getEnvelopeId(DataEntity.Account, tr.incomeAccount)
            addToMonth(node, envelopeId, tr, 'income', envelopes)
            return
          }

          // ACCOUNT OUTCOME
          if (inBudgetAccIds.includes(tr.outcomeAccount)) {
            let envelopeId = getEnvelopeId(
              DataEntity.Account,
              tr.outcomeAccount
            )
            addToMonth(node, envelopeId, tr, 'outcome', envelopes)
            return
          }
        }
      })

      console.log('Sorted keys', keys(result).sort())

      return result
    }
  )

function addToMonth(
  month: TMonthActivity,
  id: TEnvelopeId,
  tr: ITransaction,
  mode: 'income' | 'outcome',
  envelopes: ById<IEnvelope>
): void {
  const instrument = tr[`${mode}Instrument`]
  const amount = mode === 'income' ? tr.income : -tr.outcome

  // Add to total change
  month.totalActivity[instrument] = add(
    month.totalActivity[instrument] || 0,
    amount
  )

  if (!envelopes[id]?.keepIncome && mode === 'income') {
    // Add to general income
    addToAccNode(month.generalIncome)
    return
  } else {
    // Add to envelope
    let acc = (month.envelopes[id] ??= makeEnvelopeNode())
    addToAccNode(acc)
  }

  function addToAccNode(node: TEnvelopeNode): void {
    node.activity[instrument] = add(node.activity[instrument] || 0, amount)
    node.transactions.push(tr)
  }
}

function makeMonthInfo(date: TMonthActivity['date']): TMonthActivity {
  return {
    date,
    totalActivity: {},
    generalIncome: makeEnvelopeNode(),
    transferFees: makeEnvelopeNode(),
    envelopes: {},
  }
}

function makeEnvelopeNode(): TEnvelopeNode {
  return { activity: {}, transactions: [] }
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

function getTrMonth(tr: ITransaction): TMonthActivity['date'] {
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
