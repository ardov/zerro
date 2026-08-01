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

/**
 * Materializer rule 3: ZenMoney ignores a client-submitted `account.balance`
 * and recomputes it as
 * `getAccStartBalance(account) + sum(income) - sum(outcome)`.
 *
 * Without the prediction an edited amount leaves a visibly stale balance until
 * the next sync, and the damage is wider than one number: `buildBalances` walks
 * the balance history backwards from this value, so every point on the chart
 * shifts with it.
 *
 * The prediction is a delta, never a recount. Both terms of the formula are
 * differenced before and after the patch — each touched transaction's
 * contribution, and the account's own base. That keeps materialization
 * proportional to the patch rather than to the store, and rebases for free:
 * every replay recomputes the delta against the snapshot it is replayed over, so
 * a canonical balance arriving in `base` is not double-counted.
 *
 * Every account type is predicted, deliberately. The whole type difference sits
 * inside `getAccStartBalance`, which reads 0 for deposit and loan because their
 * `startBalance` holds an initial deposit or loan principal rather than a
 * balance — so raising a loan's principal correctly moves nothing. Reading the
 * base through that helper is what makes a type filter unnecessary; do not add
 * one. Debt accounts are predicted too, their balance simply feeds no read
 * model.
 *
 * Local only. `buildOutboxTransport` replays primary intent, which never
 * reaches this function, so a predicted balance cannot be sent as client
 * intent.
 */
export function predictAccountBalances(
  snapshot: TDataStore,
  patch: TNormalizedPatch
): TNormalizedPatch {
  const deltas = collectAccountDeltas(snapshot, patch)
  if (!deltas.size) return patch

  const accountsById = new Map<TAccountId, TAccount>(
    (patch.account ?? []).map(account => [account.id, account])
  )
  let predicted = false

  deltas.forEach((delta, id) => {
    if (!delta) return
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

  // A created account starts at balance 0 — `balance` is not writable, so no
  // creation intent can carry one — and the server will compute its base from
  // `startBalance`. Differencing against 0 covers creation and edit alike, and a
  // type change is covered too, because the base is read after the change.
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

/**
 * A transaction adds its income to the income account and takes its outcome
 * from the outcome account, each already in that account's own currency.
 *
 * Deleted rows contribute nothing, sourced through the same filter the read
 * models use, so a row hidden or purged by rule 2 cannot leave an amount in a
 * balance the UI still shows.
 */
function addContribution(
  add: (account: TAccountId, amount: number) => void,
  transaction: TTransaction | undefined,
  sign: 1 | -1
): void {
  if (!transaction || isDeletedTransaction(transaction)) return
  add(transaction.incomeAccount, sign * transaction.income)
  add(transaction.outcomeAccount, -sign * transaction.outcome)
}
