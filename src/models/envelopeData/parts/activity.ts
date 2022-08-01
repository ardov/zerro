import { add } from 'shared/helpers/currencyHelpers'
import { getType } from 'models/transaction/helpers'
import {
  DataEntity,
  TAccountId,
  TISOMonth,
  TTagId,
  ITransaction,
  TInstrumentId,
  TFxCode,
  TFxAmount,
  TEnvelopeId,
} from 'shared/types'
import { toISOMonth } from 'shared/helpers/date'
import { getTransactionsHistory, TrType } from 'models/transaction'
import { getDebtAccountId, getInBudgetAccounts } from 'models/account'
import { getEnvelopeId, getEnvelopes } from 'models/envelope'
import { cleanPayee } from 'models/shared/cleanPayee'
import { createSelector } from '@reduxjs/toolkit'
import { TSelector } from 'store'
import { getInstruments } from 'models/instrument'
import { getDebtors } from 'models/debtors'

export type TEnvelopeNode = {
  activity: TFxAmount
  transactions: ITransaction[]
}

export type TMonthActivity = {
  date: TISOMonth
  /** Total balance change of in budget accounts */
  totalActivity: TFxAmount
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
      getInstruments,
      getDebtors,
    ],
    (
      transactions,
      accountsInBudget,
      debtAccId,
      envelopes,
      /** Instruments needed to convert ids to currency codes */
      instruments,
      debtors
    ): Record<TISOMonth, TMonthActivity> => {
      const result: Record<TISOMonth, TMonthActivity> = {}
      const inBudgetAccIds = accountsInBudget.map(acc => acc.id)
      const toFxCode = (id: TInstrumentId): TFxCode =>
        instruments[id].shortTitle

      transactions.forEach(tr => {
        if (!isInBudget(tr, inBudgetAccIds)) return
        const date = getTrMonth(tr)
        const type = getType(tr, debtAccId)
        let node = (result[date] ??= makeMonthInfo(date))

        // TAG INCOME
        if (type === TrType.Income) {
          let envelopeId = getEnvelopeId(DataEntity.Tag, getMainTag(tr))
          addToMonth(node, envelopeId, tr, 'income')
          return
        }

        // TAG OUTCOME
        if (type === TrType.Outcome) {
          let envelopeId = getEnvelopeId(DataEntity.Tag, getMainTag(tr))
          addToMonth(node, envelopeId, tr, 'outcome')
          return
        }

        if (type === TrType.IncomeDebt) {
          // MERCHANT INCOME
          if (tr.merchant) {
            let envelopeId = getEnvelopeId(DataEntity.Merchant, tr.merchant)
            addToMonth(node, envelopeId, tr, 'income')
            return
          }

          // PAYEE INCOME
          if (tr.payee) {
            let envelopeId = getEnvelopeId('payee', cleanPayee(tr.payee))
            addToMonth(node, envelopeId, tr, 'income')
            return
          }

          throw new Error("Transaction doesn't have payee or merchant")
        }

        if (type === TrType.OutcomeDebt) {
          // MERCHANT OUTCOME
          if (tr.merchant) {
            let envelopeId = getEnvelopeId(DataEntity.Merchant, tr.merchant)
            addToMonth(node, envelopeId, tr, 'outcome')
            return
          }

          // PAYEE OUTCOME
          if (tr.payee) {
            let cleanName = cleanPayee(tr.payee)
            let debtor = debtors[cleanName]
            let envelopeId = debtor.merchantId
              ? getEnvelopeId(DataEntity.Merchant, debtor.merchantId)
              : getEnvelopeId('payee', cleanName)
            addToMonth(node, envelopeId, tr, 'outcome')
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
            const incomeFxCode = toFxCode(tr.incomeInstrument)
            node.transferFees.activity[incomeFxCode] = add(
              node.transferFees.activity[incomeFxCode] || 0,
              tr.income
            )
            const outcomeFxCode = toFxCode(tr.outcomeInstrument)
            node.transferFees.activity[outcomeFxCode] = add(
              node.transferFees.activity[outcomeFxCode] || 0,
              -tr.outcome
            )
            node.transferFees.transactions.push(tr)

            // Add to total activity
            node.totalActivity[incomeFxCode] = add(
              node.totalActivity[incomeFxCode] || 0,
              tr.income
            )
            node.totalActivity[outcomeFxCode] = add(
              node.totalActivity[outcomeFxCode] || 0,
              -tr.outcome
            )
            return
          }

          // ACCOUNT INCOME
          if (inBudgetAccIds.includes(tr.incomeAccount)) {
            let envelopeId = getEnvelopeId(
              DataEntity.Account,
              tr.outcomeAccount
            )
            addToMonth(node, envelopeId, tr, 'income')
            return
          }

          // ACCOUNT OUTCOME
          if (inBudgetAccIds.includes(tr.outcomeAccount)) {
            let envelopeId = getEnvelopeId(DataEntity.Account, tr.incomeAccount)
            addToMonth(node, envelopeId, tr, 'outcome')
            return
          }
        }
      })

      return result

      function addToMonth(
        month: TMonthActivity,
        id: TEnvelopeId,
        tr: ITransaction,
        mode: 'income' | 'outcome'
      ): void {
        const instrument = tr[`${mode}Instrument`]
        const fxCode = toFxCode(instrument)
        const amount = mode === 'income' ? tr.income : -tr.outcome

        // Add to total change
        month.totalActivity[fxCode] = add(
          month.totalActivity[fxCode] || 0,
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
          node.activity[fxCode] = add(node.activity[fxCode] || 0, amount)
          node.transactions.push(tr)
        }
      }
    }
  )

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
