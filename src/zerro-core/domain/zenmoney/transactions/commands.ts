import type { Modify } from '../../shared/types'
import type { TDataStore } from '../store'
import type { TCompiled, TCoreContext, TNormalizedPatch } from '../../../types'
import type { TDateDraft } from '../primitives'
import type { TTagId } from '../tags'
import { round } from '../../shared/money'
import { getRootUserId } from '../users'
import { makeTransaction, type TTransactionFactoryDraft } from './factory'
import { getTransaction, getTransactionType, TrType } from './read'
import type {
  TTransaction,
  TTransactionEditablePatch,
  TTransactionId,
  TTransactionPatch,
} from './types'

export type TTransactionDraft = Modify<
  Omit<TTransactionFactoryDraft, 'user'>,
  { date: TDateDraft; changed?: TDateDraft; created?: TDateDraft }
>

export function compileCreateTransaction(
  data: TDataStore,
  draft: TTransactionDraft,
  ctx: TCoreContext
): TCompiled<{ transactionId: TTransactionId }> {
  const user = getRootUserId(data)
  if (!user) throw new Error('No user')

  const transaction = makeTransaction({ ...draft, user }, ctx)

  return {
    patch: { transaction: [transaction] },
    receipt: { transactionId: transaction.id },
  }
}

export function compileDeleteTransactions(
  data: TDataStore,
  ids: TTransactionId | TTransactionId[],
  ctx: Pick<TCoreContext, 'now'>
): TNormalizedPatch {
  return {
    transaction: toArray(ids).map(id => ({
      ...getExistingTransaction(data, id),
      deleted: true,
      changed: ctx.now(),
    })),
  }
}

export function compileDeleteTransactionsPermanently(
  data: TDataStore,
  ids: TTransactionId | TTransactionId[],
  ctx: Pick<TCoreContext, 'now'>
): TNormalizedPatch {
  return {
    transaction: toArray(ids).map(id => ({
      ...getExistingTransaction(data, id),
      outcome: 0.00001,
      income: 0.00001,
      changed: ctx.now(),
    })),
  }
}

export function compileMarkTransactionsViewed(
  data: TDataStore,
  ids: TTransactionId | TTransactionId[],
  viewed: boolean,
  ctx: Pick<TCoreContext, 'now'>
): TNormalizedPatch {
  return {
    transaction: toArray(ids)
      .map(id => getExistingTransaction(data, id))
      .filter(transaction => isTransactionViewed(transaction) !== viewed)
      .map(transaction => ({
        ...transaction,
        viewed,
        changed: ctx.now(),
      })),
  }
}

export function compileApplyChangesToTransaction(
  data: TDataStore,
  patch: TTransactionPatch,
  ctx: Pick<TCoreContext, 'now'>
): TNormalizedPatch {
  const transaction = getExistingTransaction(data, patch.id)

  return {
    transaction: [{ ...transaction, ...patch, changed: ctx.now() }],
  }
}

export function compileRestoreTransaction(
  data: TDataStore,
  id: TTransactionId,
  ctx: TCoreContext
): TNormalizedPatch {
  return {
    transaction: [
      {
        ...getExistingTransaction(data, id),
        deleted: false,
        changed: ctx.now(),
        id: ctx.uuid(),
      },
    ],
  }
}

export function compileBulkEditTransactions(
  data: TDataStore,
  ids: TTransactionId[],
  opts: { tags?: TTagId[]; comment?: string },
  ctx: Pick<TCoreContext, 'now'>
): TNormalizedPatch {
  return {
    transaction: ids.map(id => {
      const transaction = getExistingTransaction(data, id)
      return {
        ...transaction,
        tag: modifyTags(transaction.tag, opts.tags),
        comment: modifyComment(transaction.comment, opts.comment),
        changed: ctx.now(),
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
  data: TDataStore,
  ids: TTransactionId[],
  ctx: Pick<TCoreContext, 'now'>
): TNormalizedPatch {
  const { incomes, outcomes } = groupTransactionsByType(data, ids)
  const outcome = outcomes[0]
  if (!outcome) throw new Error('No outcome transaction to combine into')

  const { outcomeInstrument, outcomeAccount } = outcome
  let outcomeSum = outcome.outcome

  const transaction = incomes.map(tr => {
    outcomeSum = round(outcomeSum - tr.income)
    if (tr.incomeAccount === outcomeAccount) {
      return { ...tr, changed: ctx.now(), deleted: true }
    }
    return {
      ...tr,
      changed: ctx.now(),
      outcomeAccount,
      outcome: tr.income,
      outcomeInstrument,
    }
  })
  transaction.push({ ...outcome, outcome: outcomeSum, changed: ctx.now() })

  return { transaction }
}

/**
 * Mirror of {@link compileCombineToOutcome}: combines selected outcomes into
 * the single selected income.
 */
export function compileCombineToIncome(
  data: TDataStore,
  ids: TTransactionId[],
  ctx: Pick<TCoreContext, 'now'>
): TNormalizedPatch {
  const { incomes, outcomes } = groupTransactionsByType(data, ids)
  const income = incomes[0]
  if (!income) throw new Error('No income transaction to combine into')

  const { incomeInstrument, incomeAccount } = income
  let incomeSum = income.income

  const transaction = outcomes.map(tr => {
    incomeSum = round(incomeSum - tr.outcome)
    if (tr.outcomeAccount === incomeAccount) {
      return { ...tr, changed: ctx.now(), deleted: true }
    }
    return {
      ...tr,
      changed: ctx.now(),
      incomeAccount,
      income: tr.outcome,
      incomeInstrument,
    }
  })
  transaction.push({ ...income, income: incomeSum, changed: ctx.now() })

  return { transaction }
}

/**
 * Merges one selected outcome and one selected income into a single transfer:
 * the income transaction gains the outcome side and the standalone outcome is
 * deleted. The caller guarantees exactly one income and one outcome.
 */
export function compileMergeTransactionsAsTransfer(
  data: TDataStore,
  ids: TTransactionId[],
  ctx: Pick<TCoreContext, 'now'>
): TNormalizedPatch {
  const { incomes, outcomes } = groupTransactionsByType(data, ids)
  if (incomes.length !== 1 || outcomes.length !== 1) {
    throw new Error('Transfer merge needs exactly one income and one outcome')
  }
  const income = incomes[0]
  const outcome = outcomes[0]

  return {
    transaction: [
      { ...outcome, deleted: true, changed: ctx.now() },
      {
        ...income,
        outcomeAccount: outcome.outcomeAccount,
        outcome: outcome.outcome,
        outcomeInstrument: outcome.outcomeInstrument,
        changed: ctx.now(),
      },
    ],
  }
}

function groupTransactionsByType(
  data: TDataStore,
  ids: TTransactionId[]
): { incomes: TTransaction[]; outcomes: TTransaction[] } {
  const incomes: TTransaction[] = []
  const outcomes: TTransaction[] = []

  ids.forEach(id => {
    const transaction = getExistingTransaction(data, id)
    const type = getTransactionType(transaction)
    if (type === TrType.Income) incomes.push(transaction)
    if (type === TrType.Outcome) outcomes.push(transaction)
  })

  return { incomes, outcomes }
}

function getExistingTransaction(
  data: TDataStore,
  id: TTransactionId
): TTransaction {
  const transaction = getTransaction(data, id)
  if (!transaction) throw new Error('Transaction not found')
  return transaction
}

function isTransactionViewed(transaction: TTransaction): boolean {
  if (transaction.deleted) return true
  if (transaction.viewed === true) return true
  if (transaction.viewed === undefined) return true
  return false
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
