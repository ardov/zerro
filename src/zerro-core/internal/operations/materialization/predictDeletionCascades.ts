import {
  isDeletedTransaction,
  type TAccountId,
  type TDataStore,
  type TDeletionObject,
  type TMsTime,
  type TNormalizedPatch,
  type TTransaction,
} from '../../domain/zenmoney'

/**
 * Predicts only deletion effects that have a matching canonical server
 * fixture. These additions are local read-model state: transport replays the
 * primary command and never sends them as user intent.
 */
export function predictDeletionCascades(
  snapshot: TDataStore,
  patch: TNormalizedPatch,
  changedAt: TMsTime
): TNormalizedPatch {
  return predictAccountDeletion(snapshot, patch, changedAt)
}

/**
 * Deleting an ordinary account hard-purges transactions wholly contained in
 * it. A transfer that touches one surviving account remains, with that id on
 * both legs and the deleted side zeroed. This is the exact Round 6 shape.
 *
 * An already soft-deleted transaction stays out of the prediction: its server
 * cascade has not been independently observed, and it is already absent from
 * every local read model.
 */
function predictAccountDeletion(
  snapshot: TDataStore,
  patch: TNormalizedPatch,
  changedAt: TMsTime
): TNormalizedPatch {
  const deletedAccounts = getDeletedAccounts(snapshot, patch)
  if (!deletedAccounts.size) return patch

  const primaryTransactions = new Map(
    (patch.transaction ?? []).map(transaction => [transaction.id, transaction])
  )
  const directlyDeleted = new Set(
    patch.deletion
      ?.filter(item => item.object === 'transaction')
      .map(item => String(item.id))
  )
  const effectiveTransactions = new Map<string, TTransaction>(
    Object.entries(snapshot.transaction)
  )
  primaryTransactions.forEach((transaction, id) => {
    effectiveTransactions.set(id, transaction)
  })

  const predictedDeletions: TDeletionObject[] = []
  let predicted = Boolean(
    patch.account?.some(account => deletedAccounts.has(account.id))
  )
  effectiveTransactions.forEach(transaction => {
    if (
      directlyDeleted.has(transaction.id) ||
      isDeletedTransaction(transaction)
    ) {
      return
    }
    const incomeDeleted = deletedAccounts.has(transaction.incomeAccount)
    const outcomeDeleted = deletedAccounts.has(transaction.outcomeAccount)
    if (!incomeDeleted && !outcomeDeleted) return

    if (incomeDeleted && outcomeDeleted) {
      primaryTransactions.delete(transaction.id)
      predictedDeletions.push(
        transactionDeletion(transaction, patch, changedAt)
      )
      predicted = true
      return
    }

    const survivor = incomeDeleted
      ? transaction.outcomeAccount
      : transaction.incomeAccount
    primaryTransactions.set(transaction.id, {
      ...transaction,
      income: incomeDeleted ? 0 : transaction.income,
      incomeAccount: survivor,
      outcome: outcomeDeleted ? 0 : transaction.outcome,
      outcomeAccount: survivor,
      // A transfer cannot retain a category. This also repairs an invalid
      // legacy row while matching the server's one-sided representation.
      tag: null,
      changed: nextChanged(changedAt, transaction.changed),
    })
    predicted = true
  })

  if (!predicted) return patch

  const result: TNormalizedPatch = { ...patch }
  if (patch.account) {
    const remainingAccounts = patch.account.filter(
      account => !deletedAccounts.has(account.id)
    )
    if (remainingAccounts.length) result.account = remainingAccounts
    else delete result.account
  }
  if (primaryTransactions.size)
    result.transaction = [...primaryTransactions.values()]
  else delete result.transaction
  if (predictedDeletions.length) {
    result.deletion = appendUniqueDeletions(
      patch.deletion ?? [],
      predictedDeletions
    )
  }
  return result
}

function getDeletedAccounts(
  snapshot: TDataStore,
  patch: TNormalizedPatch
): Set<TAccountId> {
  const knownAccounts = new Set<TAccountId>([
    ...Object.keys(snapshot.account),
    ...(patch.account ?? []).map(account => account.id),
  ])
  return new Set(
    patch.deletion
      ?.filter(
        (item): item is TDeletionObject & { object: 'account' } =>
          item.object === 'account' && knownAccounts.has(item.id as TAccountId)
      )
      .map(item => item.id as TAccountId)
  )
}

function transactionDeletion(
  transaction: TTransaction,
  patch: TNormalizedPatch,
  changedAt: TMsTime
): TDeletionObject {
  const accountDeletion = patch.deletion?.find(
    item => item.object === 'account'
  )
  if (!accountDeletion) throw new Error('Missing primary account deletion')
  return {
    id: transaction.id,
    object: 'transaction',
    stamp: changedAt,
    user: accountDeletion.user,
  }
}

function appendUniqueDeletions(
  current: TDeletionObject[],
  added: TDeletionObject[]
): TDeletionObject[] {
  const seen = new Set(current.map(item => `${item.object}:${item.id}`))
  return [
    ...current,
    ...added.filter(item => {
      const key = `${item.object}:${item.id}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }),
  ]
}

function nextChanged(changedAt: TMsTime, currentChanged: TMsTime): TMsTime {
  return Math.max(changedAt, currentChanged + 1000)
}
