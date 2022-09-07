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

export type TBudgetChange = {
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
      const type = getType(tr, debtAccId)
      let direction = getDirection(tr, type, inBudgetAccIds)
      if (!direction) return

      list.push({
        date: tr.date,
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
  type: TrType,
  inBudgetAccIds: TAccountId[]
): trDirection | null {
  let isFromBudget = inBudgetAccIds.includes(tr.outcomeAccount)
  let isToBudget = inBudgetAccIds.includes(tr.incomeAccount)

  switch (type) {
    case TrType.Income:
    case TrType.IncomeDebt:
      return isToBudget ? trDirection.income : null

    case TrType.Outcome:
    case TrType.OutcomeDebt:
      return isFromBudget ? trDirection.outcome : null

    case TrType.Transfer:
      if (isFromBudget && isToBudget) return trDirection.internal
      if (isFromBudget) return trDirection.outcome
      if (isToBudget) return trDirection.income
      return null

    default:
      throw new Error('Unknown transaction type: ' + type)
  }
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
