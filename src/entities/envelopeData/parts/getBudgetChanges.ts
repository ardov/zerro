import { add, addFxAmount, subFxAmount } from '@shared/helpers/money'
import { getType } from '@entities/transaction/helpers'
import {
  DataEntity,
  TAccountId,
  ITransaction,
  TFxAmount,
  TEnvelopeId,
  IInstrument,
  ById,
  TISODate,
} from '@shared/types'
import { getTransactionsHistory, TrType } from '@entities/transaction'
import { getDebtAccountId, getInBudgetAccounts } from '@entities/account'
import { getEnvelopeId } from '@entities/envelope'
import { cleanPayee } from '@entities/shared/cleanPayee'
import { createSelector } from '@reduxjs/toolkit'
import { TSelector } from '@store'
import { getInstruments } from '@entities/instrument'
import { getDebtors, TDebtor } from '@entities/debtors'

export enum trDirection {
  income = 'income',
  outcome = 'outcome',
  internal = 'internal',
}

type TBudgetChange = {
  date: TISODate
  direction: trDirection
  envelope: TEnvelopeId | null
  diff: TFxAmount
  transaction: ITransaction
}

export const getBudgetChanges: TSelector<TBudgetChange[]> = createSelector(
  [
    getTransactionsHistory,
    getInBudgetAccounts,
    getDebtAccountId,
    getInstruments,
    getDebtors,
  ],
  (
    transactions,
    accountsInBudget,
    debtAccId,
    /** Instruments needed to convert ids to currency codes */
    instruments,
    debtors
  ) => {
    const inBudgetAccIds = accountsInBudget.map(acc => acc.id)
    let list: TBudgetChange[] = []

    transactions.forEach(tr => {
      let direction = getDirection(tr, inBudgetAccIds)
      if (!direction) return

      const type = getType(tr, debtAccId)
      const date = tr.date

      list.push({
        date,
        direction,
        envelope: getEnvelope(tr, type, direction, debtors),
        diff: getDiff(tr, direction, instruments),
        transaction: tr,
      })
    })

    return list
  }
)

function getDirection(
  tr: ITransaction,
  inBudgetAccIds: TAccountId[]
): trDirection | null {
  let isFromBudget = inBudgetAccIds.includes(tr.outcomeAccount)
  let isToBudget = inBudgetAccIds.includes(tr.incomeAccount)
  if (isFromBudget && isToBudget) return trDirection.internal
  if (isFromBudget) return trDirection.outcome
  if (isToBudget) return trDirection.income
  return null
}

function getDiff(
  tr: ITransaction,
  direction: trDirection,
  instruments: ById<IInstrument>
): TFxAmount {
  let income = { [instruments[tr.incomeInstrument].shortTitle]: tr.income }
  let outcome = { [instruments[tr.outcomeInstrument].shortTitle]: -tr.outcome }
  if (direction === trDirection.income) return income
  if (direction === trDirection.outcome) return outcome
  if (direction === trDirection.internal) return addFxAmount(income, outcome)
  throw new Error('Unknown direction: ' + direction)
}

function getEnvelope(
  tr: ITransaction,
  type: TrType,
  direction: trDirection,
  debtors: ById<TDebtor>
): TEnvelopeId | null {
  switch (type) {
    case TrType.Income:
    case TrType.Outcome:
      const mainTag = tr.tag?.[0] || 'null'
      return getEnvelopeId(DataEntity.Tag, mainTag)

    case TrType.IncomeDebt:
    case TrType.OutcomeDebt:
      return getDebtorId(tr, debtors)

    case TrType.Transfer:
      if (direction === trDirection.outcome) {
        return getEnvelopeId(DataEntity.Account, tr.incomeAccount)
      }
      if (direction === trDirection.income) {
        return getEnvelopeId(DataEntity.Account, tr.outcomeAccount)
      }
      if (direction === trDirection.internal) {
        return null
      }
      throw new Error('Unknown direction: ' + direction)
    default:
      throw new Error('Unknown transaction type: ' + type)
  }
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
