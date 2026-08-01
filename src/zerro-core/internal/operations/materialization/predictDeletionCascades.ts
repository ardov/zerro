import {
  isDeletedTransaction,
  type TAccountId,
  type TDataStore,
  type TDeletionObject,
  type TMsTime,
  type TNormalizedPatch,
  type TReminder,
  type TReminderMarker,
  type TTagId,
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
  return predictTagDeletion(
    snapshot,
    predictAccountDeletion(snapshot, patch, changedAt),
    changedAt
  )
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

/**
 * A tag deletion removes its id from every category reference. Empty category
 * arrays canonicalize to null; a budget is itself keyed by the tag and is
 * therefore removed, not zeroed.
 */
function predictTagDeletion(
  snapshot: TDataStore,
  patch: TNormalizedPatch,
  changedAt: TMsTime
): TNormalizedPatch {
  const deletedTags = getDeletedTags(snapshot, patch)
  if (!deletedTags.size) return patch

  const directlyDeleted = new Set(
    patch.deletion?.map(item => `${item.object}:${item.id}`)
  )
  const tagUpdates = new Map((patch.tag ?? []).map(tag => [tag.id, tag]))
  const transactionUpdates = new Map(
    (patch.transaction ?? []).map(transaction => [transaction.id, transaction])
  )
  const reminderUpdates = new Map(
    (patch.reminder ?? []).map(reminder => [reminder.id, reminder])
  )
  const markerUpdates = new Map(
    (patch.reminderMarker ?? []).map(marker => [marker.id, marker])
  )
  const budgetUpdates = new Map(
    (patch.budget ?? []).map(budget => [budget.id, budget])
  )
  const budgetDeletions: TDeletionObject[] = []
  let predicted = false

  const tags = overlay(snapshot.tag, tagUpdates)
  tags.forEach(tag => {
    if (directlyDeleted.has(`tag:${tag.id}`)) {
      if (tagUpdates.delete(tag.id)) predicted = true
      return
    }
    if (!tag.parent || !deletedTags.has(tag.parent)) return
    tagUpdates.set(tag.id, {
      ...tag,
      parent: null,
      changed: nextChanged(changedAt, tag.changed),
    })
    predicted = true
  })

  predicted =
    rewriteTagReferences(
      overlay(snapshot.transaction, transactionUpdates),
      transactionUpdates,
      directlyDeleted,
      deletedTags,
      changedAt,
      'transaction'
    ) || predicted
  predicted =
    rewriteTagReferences(
      overlay(snapshot.reminder, reminderUpdates),
      reminderUpdates,
      directlyDeleted,
      deletedTags,
      changedAt,
      'reminder'
    ) || predicted
  predicted =
    rewriteTagReferences(
      overlay(snapshot.reminderMarker, markerUpdates),
      markerUpdates,
      directlyDeleted,
      deletedTags,
      changedAt,
      'reminderMarker'
    ) || predicted

  const budgets = overlay(snapshot.budget, budgetUpdates)
  budgets.forEach(budget => {
    if (!deletedTags.has(budget.tag as TTagId)) return
    budgetUpdates.delete(budget.id)
    budgetDeletions.push({
      id: budget.id,
      object: 'budget',
      stamp: changedAt,
      user: budget.user,
    })
    predicted = true
  })

  if (!predicted) return patch

  const result: TNormalizedPatch = { ...patch }
  if (tagUpdates.size) result.tag = [...tagUpdates.values()]
  else delete result.tag
  if (transactionUpdates.size)
    result.transaction = [...transactionUpdates.values()]
  else delete result.transaction
  if (reminderUpdates.size) result.reminder = [...reminderUpdates.values()]
  else delete result.reminder
  if (markerUpdates.size) result.reminderMarker = [...markerUpdates.values()]
  else delete result.reminderMarker
  if (budgetUpdates.size) result.budget = [...budgetUpdates.values()]
  else delete result.budget
  if (budgetDeletions.length) {
    result.deletion = appendUniqueDeletions(
      patch.deletion ?? [],
      budgetDeletions
    )
  }
  return result
}

function getDeletedTags(
  snapshot: TDataStore,
  patch: TNormalizedPatch
): Set<TTagId> {
  const knownTags = new Set<TTagId>([
    ...Object.keys(snapshot.tag),
    ...(patch.tag ?? []).map(tag => tag.id),
  ])
  return new Set(
    patch.deletion
      ?.filter(
        (item): item is TDeletionObject & { object: 'tag' } =>
          item.object === 'tag' && knownTags.has(item.id as TTagId)
      )
      .map(item => item.id as TTagId)
  )
}

function overlay<T extends { id: string }>(
  current: Record<string, T>,
  updates: Map<string, T>
): Map<string, T> {
  const result = new Map<string, T>(Object.entries(current))
  updates.forEach((entity, id) => result.set(id, entity))
  return result
}

function rewriteTagReferences<
  T extends TTransaction | TReminder | TReminderMarker,
>(
  entities: Map<string, T>,
  updates: Map<string, T>,
  directlyDeleted: Set<string>,
  deletedTags: Set<TTagId>,
  changedAt: TMsTime,
  object: 'transaction' | 'reminder' | 'reminderMarker'
): boolean {
  let rewritten = false
  entities.forEach(entity => {
    if (directlyDeleted.has(`${object}:${entity.id}`)) return
    const tag = withoutDeletedTags(entity.tag, deletedTags)
    if (tag === entity.tag) return
    updates.set(entity.id, {
      ...entity,
      tag,
      changed: nextChanged(changedAt, entity.changed),
    })
    rewritten = true
  })
  return rewritten
}

function withoutDeletedTags(
  tags: TTagId[] | null,
  deletedTags: Set<TTagId>
): TTagId[] | null {
  if (!tags) return tags
  const remaining = tags.filter(tag => !deletedTags.has(tag))
  if (remaining.length === tags.length) return tags
  return remaining.length ? remaining : null
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
