import type { ById } from '../../../foundation/types'
import type { TCoreContext } from '../../../../../types'
import type { TTagId } from '../tags'
import { round } from '../../../foundation/numbers'
import { getTransaction, getTransactionType, TrType } from './read'
import type { TTransaction, TTransactionId, TTransactionPatch } from './types'

export type TTransactionIntent = {
  transaction: TTransactionPatch[]
  /** Transaction commands intentionally do not change account balances. */
  account?: never
}

export function compileDeleteTransactions(
  transactions: ById<TTransaction>,
  ids: TTransactionId | TTransactionId[]
): TTransactionIntent {
  return {
    transaction: toArray(ids).map(id => ({
      id: getExistingTransaction(transactions, id).id,
      deleted: true,
    })),
  }
}

export function compileDeleteTransactionsPermanently(
  transactions: ById<TTransaction>,
  ids: TTransactionId | TTransactionId[]
): TTransactionIntent {
  return {
    transaction: toArray(ids).map(id => ({
      id: getExistingTransaction(transactions, id).id,
      outcome: 0.00001,
      income: 0.00001,
    })),
  }
}

export function compileRestoreTransaction(
  transactions: ById<TTransaction>,
  id: TTransactionId,
  ctx: TCoreContext
): TTransactionIntent {
  // Creation: the replacement id must be generated at issue time, so the full
  // source transaction is re-emitted under a fresh id.
  const { changed: _changed, ...source } = getExistingTransaction(
    transactions,
    id
  )
  return {
    transaction: [
      {
        ...source,
        deleted: false,
        id: ctx.uuid(),
      },
    ],
  }
}

export function compileBulkEditTransactions(
  transactions: ById<TTransaction>,
  ids: TTransactionId[],
  opts: { tags?: TTagId[]; comment?: string }
): TTransactionIntent {
  return {
    transaction: ids.map(id => {
      const transaction = getExistingTransaction(transactions, id)
      return {
        id,
        tag: modifyTags(transaction.tag, opts.tags),
        comment: modifyComment(transaction.comment, opts.comment),
      }
    }),
  }
}

/**
 * Combines selected income transactions into the single selected outcome:
 * the outcome amount is reduced by each income, same-account incomes are
 * deleted, and cross-account incomes become transfers into the outcome
 * account. Availability (single same-instrument outcome larger than the
 * incomes) is decided by the caller.
 */
export function compileCombineToOutcome(
  transactions: ById<TTransaction>,
  ids: TTransactionId[]
): TTransactionIntent {
  const { incomes, outcomes } = groupTransactionsByType(transactions, ids)
  const outcome = outcomes[0]
  if (!outcome) throw new Error('No outcome transaction to combine into')

  const { outcomeInstrument, outcomeAccount } = outcome
  let outcomeSum = outcome.outcome

  const transaction: TTransactionPatch[] = incomes.map(tr => {
    outcomeSum = round(outcomeSum - tr.income)
    if (tr.incomeAccount === outcomeAccount) {
      return { id: tr.id, deleted: true }
    }
    return {
      id: tr.id,
      outcomeAccount,
      outcome: tr.income,
      outcomeInstrument,
    }
  })
  transaction.push({ id: outcome.id, outcome: outcomeSum })

  return { transaction }
}

/**
 * Mirror of {@link compileCombineToOutcome}: combines selected outcomes into
 * the single selected income.
 */
export function compileCombineToIncome(
  transactions: ById<TTransaction>,
  ids: TTransactionId[]
): TTransactionIntent {
  const { incomes, outcomes } = groupTransactionsByType(transactions, ids)
  const income = incomes[0]
  if (!income) throw new Error('No income transaction to combine into')

  const { incomeInstrument, incomeAccount } = income
  let incomeSum = income.income

  const transaction: TTransactionPatch[] = outcomes.map(tr => {
    incomeSum = round(incomeSum - tr.outcome)
    if (tr.outcomeAccount === incomeAccount) {
      return { id: tr.id, deleted: true }
    }
    return {
      id: tr.id,
      incomeAccount,
      income: tr.outcome,
      incomeInstrument,
    }
  })
  transaction.push({ id: income.id, income: incomeSum })

  return { transaction }
}

/**
 * Merges one selected outcome and one selected income into a single transfer:
 * the income transaction gains the outcome side and the standalone outcome is
 * deleted. The caller guarantees exactly one income and one outcome.
 */
export function compileMergeTransactionsAsTransfer(
  transactions: ById<TTransaction>,
  ids: TTransactionId[]
): TTransactionIntent {
  const { incomes, outcomes } = groupTransactionsByType(transactions, ids)
  if (incomes.length !== 1 || outcomes.length !== 1) {
    throw new Error('Transfer merge needs exactly one income and one outcome')
  }
  const income = incomes[0]
  const outcome = outcomes[0]

  return {
    transaction: [
      { id: outcome.id, deleted: true },
      {
        id: income.id,
        outcomeAccount: outcome.outcomeAccount,
        outcome: outcome.outcome,
        outcomeInstrument: outcome.outcomeInstrument,
      },
    ],
  }
}

function groupTransactionsByType(
  transactions: ById<TTransaction>,
  ids: TTransactionId[]
): { incomes: TTransaction[]; outcomes: TTransaction[] } {
  const incomes: TTransaction[] = []
  const outcomes: TTransaction[] = []

  ids.forEach(id => {
    const transaction = getExistingTransaction(transactions, id)
    const type = getTransactionType(transaction)
    if (type === TrType.Income) incomes.push(transaction)
    if (type === TrType.Outcome) outcomes.push(transaction)
  })

  return { incomes, outcomes }
}

function getExistingTransaction(
  transactions: ById<TTransaction>,
  id: TTransactionId
): TTransaction {
  const transaction = getTransaction(transactions, id)
  if (!transaction) throw new Error('Transaction not found')
  return transaction
}

function modifyTags(prevTags: TTagId[] | null, newTags?: TTagId[]) {
  if (!newTags) return prevTags

  const result: TTagId[] = []
  const addId = (id: TTagId) => {
    if (!result.includes(id) && id !== 'null') result.push(id)
  }

  newTags.forEach(id => {
    if (id === 'mixed' && prevTags) prevTags.forEach(addId)
    else addId(id)
  })

  return result
}

function modifyComment(prevComment: string | null, newComment?: string) {
  if (!newComment) return prevComment
  return newComment.replaceAll('$&', prevComment || '')
}

function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
}
