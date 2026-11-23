import {
  isDeletedTransaction,
  AccountType,
  type TAccountId,
  type TDataStore,
  type TDeletionObject,
  type TMerchantId,
  type TMsTime,
  type TNormalizedPatch,
  type TReminder,
  type TReminderMarker,
  type TTagId,
  type TTransaction,
} from '../../domain/zenmoney'

/** Predict only observed server effects. Transport sends the primary command, not these derived writes. */
export function predictDeletionCascades(
  snapshot: TDataStore,
  patch: TNormalizedPatch,
  changedAt: TMsTime
): TNormalizedPatch {
  return predictMerchantDeletion(
    snapshot,
    predictTagDeletion(
      snapshot,
      predictAccountDeletion(snapshot, patch, changedAt),
      changedAt
    ),
    changedAt
  )
}

/** Deleting an account purges its isolated rows and collapses transfers onto the survivor.
 * Debt rows instead soft-delete with the removed leg nulled; skip rows already soft-deleted. */
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
    const { incomeAccount, outcomeAccount } = transaction
    if (incomeAccount === null || outcomeAccount === null) return
    const incomeDeleted = deletedAccounts.has(incomeAccount)
    const outcomeDeleted = deletedAccounts.has(outcomeAccount)
    if (!incomeDeleted && !outcomeDeleted) return

    if (incomeDeleted && outcomeDeleted) {
      primaryTransactions.delete(transaction.id)
      predictedDeletions.push(
        transactionDeletion(transaction, patch, changedAt)
      )
      predicted = true
      return
    }

    const survivor = incomeDeleted ? outcomeAccount : incomeAccount

    // Debt cannot occupy both legs. Null only the removed account leg and retain the original amounts and tags.
    if (snapshot.account[survivor]?.type === AccountType.Debt) {
      primaryTransactions.set(transaction.id, {
        ...transaction,
        deleted: true,
        incomeAccount: incomeDeleted ? null : incomeAccount,
        outcomeAccount: outcomeDeleted ? null : outcomeAccount,
        changed: nextChanged(changedAt, transaction.changed),
        // Both legs are typed as required; a nulled leg on a soft-deleted row
        // is canonical state the store validator accepts as a special case.
      } as unknown as TTransaction)
      predicted = true
      return
    }

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

/** Tag deletion clears references; remove a budget keyed by the deleted tag instead of zeroing it. */
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

/** Deleting a merchant clears the link and payee but preserves originalPayee as historical data. */
function predictMerchantDeletion(
  snapshot: TDataStore,
  patch: TNormalizedPatch,
  changedAt: TMsTime
): TNormalizedPatch {
  const requestedMerchants = getDeletedMerchants(snapshot, patch)
  if (!requestedMerchants.size) return patch

  // An active debt blocks merchant deletion on the server. Omit only the local prediction; still send the command.
  const debtBlockedMerchants = getDebtBlockedMerchants(snapshot, patch)
  const deletedMerchants = new Set(
    [...requestedMerchants].filter(id => !debtBlockedMerchants.has(id))
  )
  const retainedDeletions = patch.deletion?.filter(
    item =>
      item.object !== 'merchant' ||
      !debtBlockedMerchants.has(item.id as TMerchantId)
  )
  const withoutBlockedDeletions =
    retainedDeletions?.length === patch.deletion?.length
      ? patch
      : withoutDeletions(patch, retainedDeletions)
  if (!deletedMerchants.size) return withoutBlockedDeletions

  const directlyDeleted = new Set(
    patch.deletion?.map(item => `${item.object}:${item.id}`)
  )
  const merchantUpdates = new Map(
    (patch.merchant ?? []).map(merchant => [merchant.id, merchant])
  )
  const transactionUpdates = new Map(
    (patch.transaction ?? []).map(transaction => [transaction.id, transaction])
  )
  const reminderUpdates = new Map(
    (patch.reminder ?? []).map(reminder => [reminder.id, reminder])
  )
  const markerUpdates = new Map(
    (patch.reminderMarker ?? []).map(marker => [marker.id, marker])
  )
  const merchantDeletions: TDeletionObject[] = []
  let predicted = false

  deletedMerchants.forEach(id => {
    if (merchantUpdates.delete(id)) predicted = true
  })
  const transactions = overlay(snapshot.transaction, transactionUpdates)
  transactions.forEach(transaction => {
    if (
      directlyDeleted.has(`transaction:${transaction.id}`) ||
      !transaction.deleted ||
      !transaction.merchant ||
      !deletedMerchants.has(transaction.merchant) ||
      !isDebtTransaction(snapshot, transaction)
    ) {
      return
    }
    transactionUpdates.delete(transaction.id)
    directlyDeleted.add(`transaction:${transaction.id}`)
    merchantDeletions.push(
      merchantCascadeTransactionDeletion(transaction, patch, changedAt)
    )
    predicted = true
  })
  predicted =
    rewriteMerchantReferences(
      transactions,
      transactionUpdates,
      directlyDeleted,
      deletedMerchants,
      changedAt,
      'transaction'
    ) || predicted
  predicted =
    rewriteMerchantReferences(
      overlay(snapshot.reminder, reminderUpdates),
      reminderUpdates,
      directlyDeleted,
      deletedMerchants,
      changedAt,
      'reminder'
    ) || predicted
  predicted =
    rewriteMerchantReferences(
      overlay(snapshot.reminderMarker, markerUpdates),
      markerUpdates,
      directlyDeleted,
      deletedMerchants,
      changedAt,
      'reminderMarker'
    ) || predicted

  if (!predicted) return withoutBlockedDeletions

  const result: TNormalizedPatch = { ...withoutBlockedDeletions }
  if (merchantUpdates.size) result.merchant = [...merchantUpdates.values()]
  else delete result.merchant
  if (transactionUpdates.size)
    result.transaction = [...transactionUpdates.values()]
  else delete result.transaction
  if (reminderUpdates.size) result.reminder = [...reminderUpdates.values()]
  else delete result.reminder
  if (markerUpdates.size) result.reminderMarker = [...markerUpdates.values()]
  else delete result.reminderMarker
  if (merchantDeletions.length) {
    result.deletion = appendUniqueDeletions(
      withoutBlockedDeletions.deletion ?? [],
      merchantDeletions
    )
  }
  return result
}

function withoutDeletions(
  patch: TNormalizedPatch,
  deletion: TDeletionObject[] | undefined
): TNormalizedPatch {
  const result = { ...patch }
  if (deletion?.length) result.deletion = deletion
  else delete result.deletion
  return result
}

function getDebtBlockedMerchants(
  snapshot: TDataStore,
  patch: TNormalizedPatch
): Set<TMerchantId> {
  const directlyDeleted = new Set(
    patch.deletion
      ?.filter(item => item.object === 'transaction')
      .map(item => String(item.id))
  )
  const transactions = overlay(
    snapshot.transaction,
    new Map(
      (patch.transaction ?? []).map(transaction => [
        transaction.id,
        transaction,
      ])
    )
  )
  const blocked = new Set<TMerchantId>()
  transactions.forEach(transaction => {
    if (
      directlyDeleted.has(transaction.id) ||
      isDeletedTransaction(transaction) ||
      !transaction.merchant
    ) {
      return
    }
    if (isDebtTransaction(snapshot, transaction)) {
      blocked.add(transaction.merchant)
    }
  })
  return blocked
}

function isDebtTransaction(
  snapshot: TDataStore,
  transaction: TTransaction
): boolean {
  const legType = (id: TAccountId | null) =>
    id === null ? undefined : snapshot.account[id]?.type
  return (
    legType(transaction.incomeAccount) === AccountType.Debt ||
    legType(transaction.outcomeAccount) === AccountType.Debt
  )
}

function getDeletedMerchants(
  snapshot: TDataStore,
  patch: TNormalizedPatch
): Set<TMerchantId> {
  const knownMerchants = new Set<TMerchantId>([
    ...Object.keys(snapshot.merchant),
    ...(patch.merchant ?? []).map(merchant => merchant.id),
  ])
  return new Set(
    patch.deletion
      ?.filter(
        (item): item is TDeletionObject & { object: 'merchant' } =>
          item.object === 'merchant' &&
          knownMerchants.has(item.id as TMerchantId)
      )
      .map(item => item.id as TMerchantId)
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

function rewriteMerchantReferences<
  T extends TTransaction | TReminder | TReminderMarker,
>(
  entities: Map<string, T>,
  updates: Map<string, T>,
  directlyDeleted: Set<string>,
  deletedMerchants: Set<TMerchantId>,
  changedAt: TMsTime,
  object: 'transaction' | 'reminder' | 'reminderMarker'
): boolean {
  let rewritten = false
  entities.forEach(entity => {
    if (
      directlyDeleted.has(`${object}:${entity.id}`) ||
      !entity.merchant ||
      !deletedMerchants.has(entity.merchant)
    ) {
      return
    }
    updates.set(entity.id, {
      ...entity,
      merchant: null,
      payee: null,
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

function merchantCascadeTransactionDeletion(
  transaction: TTransaction,
  patch: TNormalizedPatch,
  changedAt: TMsTime
): TDeletionObject {
  const merchantDeletion = patch.deletion?.find(
    item => item.object === 'merchant'
  )
  if (!merchantDeletion) throw new Error('Missing primary merchant deletion')
  return {
    id: transaction.id,
    object: 'transaction',
    stamp: changedAt,
    user: merchantDeletion.user,
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
