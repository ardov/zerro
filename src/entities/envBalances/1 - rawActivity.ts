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
import { accountModel, TAccountPopulated } from '@entities/account'
import { debtorModel, TDebtor } from '@entities/debtors'
import { instrumentModel } from '@entities/currency/instrument'
import { cleanPayee } from '@entities/shared/cleanPayee'
import { trModel, TrType } from '@entities/transaction'
import { envelopeModel } from '@entities/envelope'

export type TRawActivityNode = {
  internal: EnvActivity
  income: Record<TEnvelopeId, EnvActivity>
  outcome: Record<TEnvelopeId, EnvActivity>
}

export const getRawActivity: TSelector<ByMonth<TRawActivityNode>> =
  createSelector(
    [
      trModel.getTransactionsHistory,
      accountModel.getInBudgetAccounts,
      accountModel.getDebtAccountId,
      debtorModel.getDebtors,
      instrumentModel.getInstruments,
    ],
    withPerf('🖤 getRawActivity', getRawActivityFn)
  )

function getRawActivityFn(
  transactions: TTransaction[],
  inBudgetAccsPop: TAccountPopulated[],
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
    const type = trModel.getType(tr, debtAccId)

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
    const node = (res[month].income[envId] ??= new EnvActivity())
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
    const node = (res[month].outcome[envId] ??= new EnvActivity())
    node.transactions.push(tr)
    node.total = addFxAmount(node.total, change)
    node.trend[dayIdx] = addFxAmount(node.trend[dayIdx], change)
  }
}

// Helpers

function makeMonthNode(): TRawActivityNode {
  return {
    internal: new EnvActivity(),
    income: {},
    outcome: {},
  }
}

/**
 * Groupped transactions info
 * - `total` — fx amount
 * - `trend` — 31 fx amount points
 * - `transactions` — list of transactions
 * */
export class EnvActivity {
  total: TFxAmount = {}
  trend: TFxAmount[] = new Array(31).fill({}).map(_ => ({}))
  transactions: TTransaction[] = []

  static merge(
    a: EnvActivity | undefined,
    b: EnvActivity | undefined
  ): EnvActivity {
    if (!a && !b) return new EnvActivity()
    if (!a) return b!
    if (!b) return a
    return {
      total: addFxAmount(a.total, b.total),
      trend: a.trend.map((val, i) => addFxAmount(val, b.trend[i])),
      transactions: [...a.transactions, ...b.transactions].sort(
        trModel.compareTrDates
      ),
    }
  }
}

/** Returns envelope id for a given transaction */
function getEnvelope(
  tr: TTransaction,
  direction: 'income' | 'outcome',
  debtAccId: TAccountId | undefined,
  debtors: ById<TDebtor>
): TEnvelopeId {
  const type = trModel.getType(tr, debtAccId)
  const makeId = envelopeModel.makeId
  switch (type) {
    case TrType.Income:
    case TrType.Outcome:
      return makeId(DataEntity.Tag, tr.tag?.[0] || 'null')

    case TrType.IncomeDebt:
    case TrType.OutcomeDebt:
      return getDebtorId(tr)

    case TrType.Transfer:
      if (direction === 'outcome') {
        return makeId(DataEntity.Account, tr.incomeAccount)
      }
      if (direction === 'income') {
        return makeId(DataEntity.Account, tr.outcomeAccount)
      }
      throw new Error('Unknown direction: ' + direction)
    default:
      throw new Error('Unknown transaction type: ' + type)
  }

  function getDebtorId(tr: TTransaction): TEnvelopeId {
    if (tr.merchant) return makeId(DataEntity.Merchant, tr.merchant)
    // PAYEE INCOME
    let cleanName = cleanPayee(String(tr.payee))
    let debtor = debtors[cleanName]
    return debtor.merchantId
      ? makeId(DataEntity.Merchant, debtor.merchantId)
      : makeId('payee', cleanName)
  }
}
