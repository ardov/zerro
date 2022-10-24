import { createSelector } from '@reduxjs/toolkit'
import {
  ById,
  ByMonth,
  DataEntity,
  TAccountId,
  TEnvelopeId,
  TFxAmount,
  TInstrument,
  TTransaction,
} from '@shared/types'
import { toISOMonth } from '@shared/helpers/date'
import { addFxAmount } from '@shared/helpers/money'
import { withPerf } from '@shared/helpers/performance'
import { TSelector } from '@store/index'
import {
  getDebtAccountId,
  getInBudgetAccounts,
  IAccountPopulated,
} from '@entities/account'
import { getDebtors, TDebtor } from '@entities/debtors'
import { getEnvelopeId } from '@entities/envelope'
import { getInstruments } from '@entities/instrument'
import { cleanPayee } from '@entities/shared/cleanPayee'
import { getTransactionsHistory, getType, TrType } from '@entities/transaction'

type TActivityNode = {
  total: TFxAmount
  trend: TFxAmount[]
  transactions: TTransaction[]
}
export type TRawActivityNode = {
  internal: TActivityNode
  income: Record<TEnvelopeId, TActivityNode>
  outcome: Record<TEnvelopeId, TActivityNode>
}

export const getRawActivity: TSelector<ByMonth<TRawActivityNode>> =
  createSelector(
    [
      getTransactionsHistory,
      getInBudgetAccounts,
      getDebtAccountId,
      getDebtors,
      getInstruments,
    ],
    withPerf('🖤 getRawActivity', getRawActivityFn)
  )

function getRawActivityFn(
  transactions: TTransaction[],
  inBudgetAccsPop: IAccountPopulated[],
  debtAccId: TAccountId | undefined,
  debtors: ById<TDebtor>,
  instruments: ById<TInstrument>
) {
  const inBudgetAccs = inBudgetAccsPop.map(acc => acc.id)
  const res: ByMonth<TRawActivityNode> = {}
  transactions.forEach(addTransaction)
  return res

  function addTransaction(tr: TTransaction) {
    const fromBudget = inBudgetAccs.includes(tr.outcomeAccount)
    const toBudget = inBudgetAccs.includes(tr.incomeAccount)
    const type = getType(tr, debtAccId)

    // Not in budget -> skip
    if (!fromBudget && !toBudget) {
      return
    }

    // Inbudget transfer -> check for fees
    if (type === TrType.Transfer && fromBudget && toBudget) {
      return addInternal(tr)
    }

    // Outcoming transaction
    if (
      type === TrType.Outcome ||
      type === TrType.OutcomeDebt ||
      (type === TrType.Transfer && fromBudget)
    ) {
      return addOutcome(tr)
    }

    // Incoming transaction
    if (
      type === TrType.Income ||
      type === TrType.IncomeDebt ||
      (type === TrType.Transfer && toBudget)
    ) {
      return addIncome(tr)
    }
  }

  function addInternal(tr: TTransaction) {
    const change = addFxAmount(
      { [instruments[tr.incomeInstrument].shortTitle]: tr.income },
      { [instruments[tr.outcomeInstrument].shortTitle]: -tr.outcome }
    )
    const dayIdx = new Date(tr.date).getDate() - 1
    const month = toISOMonth(tr.date)
    const node = (res[month] ??= makeMonthNode()).internal
    node.transactions.push(tr)
    node.total = addFxAmount(node.total, change)
    node.trend[dayIdx] = addFxAmount(node.trend[dayIdx], change)
  }

  function addIncome(tr: TTransaction) {
    const change = {
      [instruments[tr.incomeInstrument].shortTitle]: tr.income,
    }
    const envId = getEnvelope(tr, 'income', debtAccId, debtors)
    const dayIdx = new Date(tr.date).getDate() - 1
    const month = toISOMonth(tr.date)
    res[month] ??= makeMonthNode()
    const node = (res[month].income[envId] ??= makeActivityNode())
    node.transactions.push(tr)
    node.total = addFxAmount(node.total, change)
    node.trend[dayIdx] = addFxAmount(node.trend[dayIdx], change)
  }

  function addOutcome(tr: TTransaction) {
    const change = {
      [instruments[tr.outcomeInstrument].shortTitle]: -tr.outcome,
    }
    const envId = getEnvelope(tr, 'outcome', debtAccId, debtors)
    const dayIdx = new Date(tr.date).getDate() - 1
    const month = toISOMonth(tr.date)
    res[month] ??= makeMonthNode()
    const node = (res[month].outcome[envId] ??= makeActivityNode())
    node.transactions.push(tr)
    node.total = addFxAmount(node.total, change)
    node.trend[dayIdx] = addFxAmount(node.trend[dayIdx], change)
  }
}

// Helpers

function makeActivityNode(): TActivityNode {
  return {
    total: {},
    trend: new Array(31).fill({}),
    transactions: [],
  }
}

function makeMonthNode(): TRawActivityNode {
  return {
    internal: makeActivityNode(),
    income: {},
    outcome: {},
  }
}

function getEnvelope(
  tr: TTransaction,
  direction: 'income' | 'outcome',
  debtAccId: TAccountId | undefined,
  debtors: ById<TDebtor>
): TEnvelopeId {
  const type = getType(tr, debtAccId)
  switch (type) {
    case TrType.Income:
    case TrType.Outcome:
      return getEnvelopeId(DataEntity.Tag, tr.tag?.[0] || 'null')

    case TrType.IncomeDebt:
    case TrType.OutcomeDebt:
      return getDebtorId(tr, debtors)

    case TrType.Transfer:
      if (direction === 'outcome') {
        return getEnvelopeId(DataEntity.Account, tr.incomeAccount)
      }
      if (direction === 'income') {
        return getEnvelopeId(DataEntity.Account, tr.outcomeAccount)
      }
      throw new Error('Unknown direction: ' + direction)
    default:
      throw new Error('Unknown transaction type: ' + type)
  }
}

function getDebtorId(tr: TTransaction, debtors: ById<TDebtor>): TEnvelopeId {
  if (tr.merchant) return getEnvelopeId(DataEntity.Merchant, tr.merchant)
  // PAYEE INCOME
  let cleanName = cleanPayee(String(tr.payee))
  let debtor = debtors[cleanName]
  return debtor.merchantId
    ? getEnvelopeId(DataEntity.Merchant, debtor.merchantId)
    : getEnvelopeId('payee', cleanName)
}
