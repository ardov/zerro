import type { TDataStore } from '../store'
import {
  DataEntity,
  type TCoreContext,
  type TNormalizedPatch,
} from '../../../types'
import { add } from '../../shared/money'
import { getRootUserId } from '../users'
import { getTransactionsHistory } from '../transactions/read'
import type { TTransaction } from '../transactions/types'
import { makeAccount, type TAccountFactoryDraft } from './factory'
import { getAccounts } from './read'
import type { TAccountId, TAccountPatch } from './types'

export type TAccountDraft = Omit<TAccountFactoryDraft, 'user'>

export function compileCreateAccount(
  data: TDataStore,
  draft: TAccountDraft,
  ctx: TCoreContext
): TNormalizedPatch {
  const user = getRootUserId(data)
  if (!user) throw new Error('No user')

  return {
    account: [makeAccount({ ...draft, user }, ctx)],
  }
}

export function compilePatchAccount(
  data: TDataStore,
  patch: TAccountPatch | TAccountPatch[],
  ctx: Pick<TCoreContext, 'now'>
): TNormalizedPatch {
  const list = Array.isArray(patch) ? patch : [patch]

  return {
    account: list.map(item => {
      if (!item.id) throw new Error('Trying to patch account without id')

      const current = getAccounts(data)[item.id]
      if (!current) throw new Error('Account not found')

      return { ...current, ...item, changed: ctx.now() }
    }),
  }
}

export function compileDeleteAccount(
  data: TDataStore,
  id: TAccountId,
  ctx: Pick<TCoreContext, 'now'>
): TNormalizedPatch {
  if (!getAccounts(data)[id]) throw new Error('Account not found')

  const user = getRootUserId(data)
  if (!user) throw new Error('No user')

  return {
    deletion: [
      {
        id,
        object: DataEntity.Account,
        stamp: ctx.now(),
        user,
      },
    ],
  }
}

/**
 * Merges the source account into the target and deletes the source. Both must
 * share a currency. Transfers between the two accounts are deleted (their
 * amounts fold into the target's starting balance); every other transaction on
 * the source is reassigned to the target. The target's start and current
 * balances absorb the source's.
 */
export function compileMergeAccounts(
  data: TDataStore,
  source: TAccountId,
  target: TAccountId,
  ctx: Pick<TCoreContext, 'now'>
): TNormalizedPatch {
  const accounts = getAccounts(data)
  const sourceAcc = accounts[source]
  const targetAcc = accounts[target]
  if (!sourceAcc || !targetAcc) throw new Error('Account not found')
  if (source === target) throw new Error('Accounts should be different')

  const user = getRootUserId(data)
  if (!user) throw new Error('No user')
  if (sourceAcc.instrument !== targetAcc.instrument) {
    throw new Error('Currency should be the same')
  }

  const changes: TTransaction[] = []
  const reminderChanges = Object.values(data.reminder)
    .filter(
      reminder =>
        reminder.incomeAccount === source || reminder.outcomeAccount === source
    )
    .map(reminder => ({
      ...reminder,
      incomeAccount:
        reminder.incomeAccount === source ? target : reminder.incomeAccount,
      outcomeAccount:
        reminder.outcomeAccount === source ? target : reminder.outcomeAccount,
      changed: ctx.now(),
    }))
  let targetStartChange = sourceAcc.startBalance

  getTransactionsHistory(data).forEach(tr => {
    const isSourceTargetTransfer =
      (tr.outcomeAccount === target && tr.incomeAccount === source) ||
      (tr.outcomeAccount === source && tr.incomeAccount === target)

    if (isSourceTargetTransfer) {
      // A transfer between the merged accounts becomes internal: drop it and
      // fold its net movement into the surviving start balance.
      targetStartChange = add(targetStartChange, tr.income, -tr.outcome)
      changes.push({ ...tr, deleted: true, changed: ctx.now() })
      return
    }

    if (tr.incomeAccount === source || tr.outcomeAccount === source) {
      changes.push({
        ...tr,
        incomeAccount: tr.incomeAccount === source ? target : tr.incomeAccount,
        outcomeAccount:
          tr.outcomeAccount === source ? target : tr.outcomeAccount,
        changed: ctx.now(),
      })
    }
  })

  return {
    transaction: changes,
    reminder: reminderChanges,
    account: [
      {
        ...targetAcc,
        startBalance: add(targetStartChange, targetAcc.startBalance),
        balance: add(sourceAcc.balance, targetAcc.balance),
        changed: ctx.now(),
      },
    ],
    deletion: [
      {
        id: source,
        object: DataEntity.Account,
        stamp: ctx.now(),
        user,
      },
    ],
  }
}
