import {
  getAccStartBalance,
  isDeletedTransaction,
  type TAccount,
  type TAccountId,
  type TDataStore,
  type TNormalizedPatch,
  type TTransaction,
  type TTransactionId,
} from '../../domain/zenmoney'

/** Predict only local balance deltas from touched rows so replay rebases without double-counting the server's balance.
 * Read the base via getAccStartBalance: for loans and deposits, startBalance is principal. */
export function predictAccountBalances(
  snapshot: TDataStore,
  patch: TNormalizedPatch
): TNormalizedPatch {
  const deltas = collectAccountDeltas(snapshot, patch)
  if (!deltas.size) return patch

  const deletedAccounts = new Set(
    patch.deletion
      ?.filter(item => item.object === 'account')
      .map(item => item.id as TAccountId)
  )
  const accountsById = new Map<TAccountId, TAccount>(
    (patch.account ?? []).map(account => [account.id, account])
  )
  let predicted = false

  deltas.forEach((delta, id) => {
    if (!delta || deletedAccounts.has(id)) return
    const account = accountsById.get(id) ?? snapshot.account[id]
    if (!account) return
    accountsById.set(id, { ...account, balance: account.balance + delta })
    predicted = true
  })

  if (!predicted) return patch
  return { ...patch, account: [...accountsById.values()] }
}

function collectAccountDeltas(
  snapshot: TDataStore,
  patch: TNormalizedPatch
): Map<TAccountId, number> {
  const deltas = new Map<TAccountId, number>()
  const add = (account: TAccountId, amount: number) => {
    if (!amount) return
    deltas.set(account, (deltas.get(account) ?? 0) + amount)
  }

  // Creation starts from a balance of zero. Read the updated base to cover both changes in principal and account type.
  patch.account?.forEach(next => {
    const previous = snapshot.account[next.id]
    add(
      next.id,
      getAccStartBalance(next) - (previous ? getAccStartBalance(previous) : 0)
    )
  })

  const upserted = new Set<TTransactionId>()
  patch.transaction?.forEach(next => {
    upserted.add(next.id)
    addContribution(add, snapshot.transaction[next.id], -1)
    addContribution(add, next, 1)
  })

  patch.deletion?.forEach(item => {
    // `applyPatch` deletes before it upserts, so a row present in both survives.
    if (item.object !== 'transaction') return
    if (upserted.has(item.id as TTransactionId)) return
    addContribution(add, snapshot.transaction[item.id], -1)
  })

  return deltas
}

/** Use the read-model deletion filter so hidden and purged rows cannot contribute to visible balances. */
function addContribution(
  add: (account: TAccountId, amount: number) => void,
  transaction: TTransaction | undefined,
  sign: 1 | -1
): void {
  if (!transaction || isDeletedTransaction(transaction)) return
  if (transaction.incomeAccount !== null)
    add(transaction.incomeAccount, sign * transaction.income)
  if (transaction.outcomeAccount !== null)
    add(transaction.outcomeAccount, -sign * transaction.outcome)
}
