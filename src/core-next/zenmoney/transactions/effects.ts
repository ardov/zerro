import { add } from '6-shared/helpers/money'
import type {
  TAccount,
  TAccountId,
  TDataStore,
} from '6-shared/types'
import type { TCoreContext, TNormalizedPatch } from '../../types'
import { getAccount } from '../accounts'
import { getTransaction } from './read'
import type { TTransaction } from './types'

type TAccountBalanceDeltas = Partial<Record<TAccountId, number>>

export function withTransactionAccountBalanceEffects(
  data: TDataStore,
  patch: TNormalizedPatch,
  ctx: Pick<TCoreContext, 'now'>
): TNormalizedPatch {
  if (!patch.transaction?.length) return patch

  const deltas = getTransactionAccountBalanceDeltas(data, patch.transaction)
  const patchedAccounts = mergeAccountBalanceDeltas(
    data,
    patch.account,
    deltas,
    ctx
  )

  if (!patchedAccounts.length) return patch
  return { ...patch, account: patchedAccounts }
}

export function getTransactionAccountBalanceDeltas(
  data: TDataStore,
  transactions: TTransaction[]
): TAccountBalanceDeltas {
  const deltas: TAccountBalanceDeltas = {}

  transactions.forEach(transaction => {
    const current = getTransaction(data, transaction.id) || undefined
    addTransactionEffect(deltas, current, -1)
    addTransactionEffect(deltas, transaction, 1)
  })

  return deltas
}

function mergeAccountBalanceDeltas(
  data: TDataStore,
  patchAccounts: TAccount[] | undefined,
  deltas: TAccountBalanceDeltas,
  ctx: Pick<TCoreContext, 'now'>
): TAccount[] {
  const accountsById = new Map<TAccountId, TAccount>()
  patchAccounts?.forEach(account => accountsById.set(account.id, account))

  Object.entries(deltas).forEach(([id, delta]) => {
    if (!delta) return

    const account = accountsById.get(id) || getAccount(data, id)
    if (!account) throw new Error('Account not found')

    accountsById.set(id, {
      ...account,
      balance: add(account.balance, delta),
      changed: ctx.now(),
    })
  })

  return Array.from(accountsById.values())
}

function addTransactionEffect(
  deltas: TAccountBalanceDeltas,
  transaction: TTransaction | undefined,
  multiplier: 1 | -1
) {
  if (!transaction || transaction.deleted) return

  addDelta(deltas, transaction.incomeAccount, transaction.income * multiplier)
  addDelta(
    deltas,
    transaction.outcomeAccount,
    -transaction.outcome * multiplier
  )
}

function addDelta(
  deltas: TAccountBalanceDeltas,
  accountId: TAccountId,
  delta: number
) {
  if (!delta) return
  deltas[accountId] = add(deltas[accountId] || 0, delta)
}
