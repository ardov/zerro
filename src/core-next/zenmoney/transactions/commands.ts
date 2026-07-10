import type { Modify, OptionalExceptFor } from '../../shared/types'
import type { TDataStore } from '../store'
import type { TCompiled, TCoreContext, TNormalizedPatch } from '../../types'
import type { TDateDraft } from '../primitives'
import type { TTagId } from '../tags'
import { getRootUserId } from '../users'
import { withTransactionAccountBalanceEffects } from './effects'
import { makeTransaction, type TTransactionFactoryDraft } from './factory'
import { getTransaction } from './read'
import type { TTransaction, TTransactionId } from './types'

export type TTransactionPatch = OptionalExceptFor<TTransaction, 'id'>
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
    patch: withTransactionAccountBalanceEffects(
      data,
      {
        transaction: [transaction],
      },
      ctx
    ),
    receipt: { transactionId: transaction.id },
  }
}

export function compileDeleteTransactions(
  data: TDataStore,
  ids: TTransactionId | TTransactionId[],
  ctx: Pick<TCoreContext, 'now'>
): TNormalizedPatch {
  return withTransactionAccountBalanceEffects(
    data,
    {
      transaction: toArray(ids).map(id => ({
        ...getExistingTransaction(data, id),
        deleted: true,
        changed: ctx.now(),
      })),
    },
    ctx
  )
}

export function compileDeleteTransactionsPermanently(
  data: TDataStore,
  ids: TTransactionId | TTransactionId[],
  ctx: Pick<TCoreContext, 'now'>
): TNormalizedPatch {
  return withTransactionAccountBalanceEffects(
    data,
    {
      transaction: toArray(ids).map(id => ({
        ...getExistingTransaction(data, id),
        outcome: 0.00001,
        income: 0.00001,
        changed: ctx.now(),
      })),
    },
    ctx
  )
}

export function compileMarkTransactionsViewed(
  data: TDataStore,
  ids: TTransactionId | TTransactionId[],
  viewed: boolean,
  ctx: Pick<TCoreContext, 'now'>
): TNormalizedPatch {
  return withTransactionAccountBalanceEffects(
    data,
    {
      transaction: toArray(ids)
        .map(id => getExistingTransaction(data, id))
        .filter(transaction => isTransactionViewed(transaction) !== viewed)
        .map(transaction => ({
          ...transaction,
          viewed,
          changed: ctx.now(),
        })),
    },
    ctx
  )
}

export function compileApplyChangesToTransaction(
  data: TDataStore,
  patch: TTransactionPatch,
  ctx: Pick<TCoreContext, 'now'>
): TNormalizedPatch {
  const transaction = getExistingTransaction(data, patch.id)

  return withTransactionAccountBalanceEffects(
    data,
    {
      transaction: [{ ...transaction, ...patch, changed: ctx.now() }],
    },
    ctx
  )
}

export function compileRestoreTransaction(
  data: TDataStore,
  id: TTransactionId,
  ctx: TCoreContext
): TNormalizedPatch {
  return withTransactionAccountBalanceEffects(
    data,
    {
      transaction: [
        {
          ...getExistingTransaction(data, id),
          deleted: false,
          changed: ctx.now(),
          id: ctx.uuid(),
        },
      ],
    },
    ctx
  )
}

export function compileRecreateTransaction(
  data: TDataStore,
  patch: TTransactionPatch,
  ctx: TCoreContext
): TCompiled<{ transactionId: TTransactionId }> {
  const transaction = getExistingTransaction(data, patch.id)
  const transactionId = ctx.uuid()

  return {
    patch: withTransactionAccountBalanceEffects(
      data,
      {
        transaction: [
          {
            ...transaction,
            outcome: 0.00001,
            income: 0.00001,
            changed: ctx.now(),
          },
          {
            ...transaction,
            ...patch,
            id: transactionId,
            changed: ctx.now(),
          },
        ],
      },
      ctx
    ),
    receipt: { transactionId },
  }
}

export function compileBulkEditTransactions(
  data: TDataStore,
  ids: TTransactionId[],
  opts: { tags?: TTagId[]; comment?: string },
  ctx: Pick<TCoreContext, 'now'>
): TNormalizedPatch {
  return withTransactionAccountBalanceEffects(
    data,
    {
      transaction: ids.map(id => {
        const transaction = getExistingTransaction(data, id)
        return {
          ...transaction,
          tag: modifyTags(transaction.tag, opts.tags),
          comment: modifyComment(transaction.comment, opts.comment),
          changed: ctx.now(),
        }
      }),
    },
    ctx
  )
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
