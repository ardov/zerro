import { add } from '@shared/helpers/money'
import { getType } from '@entities/transaction/helpers'
import {
  DataEntity,
  TAccountId,
  TISOMonth,
  ITransaction,
  TInstrumentId,
  TFxCode,
  TFxAmount,
  TEnvelopeId,
  ById,
} from '@shared/types'
import { toISOMonth } from '@shared/helpers/date'
import { getTransactionsHistory, TrType } from '@entities/transaction'
import { getDebtAccountId, getInBudgetAccounts } from '@entities/account'
import { getEnvelopeId, getEnvelopes } from '@entities/envelope'
import { cleanPayee } from '@entities/shared/cleanPayee'
import { createSelector } from '@reduxjs/toolkit'
import { TSelector } from '@store'
import { getInstruments } from '@entities/instrument'
import { getDebtors, TDebtor } from '@entities/debtors'

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
          addToMonth(node, getTagId(tr), tr, 'income')
          return
        }

        // TAG OUTCOME
        if (type === TrType.Outcome) {
          addToMonth(node, getTagId(tr), tr, 'outcome')
          return
        }

        // MERCHANT INCOME
        if (type === TrType.IncomeDebt) {
          addToMonth(node, getDebtorId(tr, debtors), tr, 'income')
          return
        }

        // MERCHANT OUTCOME
        if (type === TrType.OutcomeDebt) {
          addToMonth(node, getDebtorId(tr, debtors), tr, 'outcome')
          return
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

function isInBudget(tr: ITransaction, inBudgetAccs: TAccountId[]): boolean {
  return (
    inBudgetAccs.includes(tr.incomeAccount) ||
    inBudgetAccs.includes(tr.outcomeAccount)
  )
}

function getTagId(tr: ITransaction): TEnvelopeId {
  const mainTag = tr.tag?.[0] || 'null'
  return getEnvelopeId(DataEntity.Tag, mainTag)
}

function getDebtorId(tr: ITransaction, debtors: ById<TDebtor>): TEnvelopeId {
  if (tr.merchant) return getEnvelopeId(DataEntity.Merchant, tr.merchant)
  // PAYEE INCOME
  let cleanName = cleanPayee(String(tr.payee))
  let debtor = debtors[cleanName]
  return debtor.merchantId
    ? getEnvelopeId(DataEntity.Merchant, debtor.merchantId)
    : getEnvelopeId('payee', cleanName)
}
