# Materializer rules and cascades

- Status: contract for local predicted effects
- Updated: 2026-07-25

## Purpose

[architecture.md](./architecture.md#materialization) defines the pipeline; this
document defines its content: for every write, what Core predicts locally, what
ZenMoney does on its own, and where the two deliberately differ.

Three layers must stay distinct:

| Layer            | Owner            | Sent to server | Notes                                    |
| ---------------- | ---------------- | -------------- | ---------------------------------------- |
| Primary intent   | command compiler | yes            | the persisted sparse patch               |
| Predicted effect | materializer     | **no**         | local-only, so the UI is correct at once |
| Canonical effect | ZenMoney         | n/a            | arrives in the diff, bypasses this layer |

Predicting an effect is a UI-latency decision, never a correctness one: the
server recomputes everything it owns. So the rule for adding a prediction is
"would the user see a wrong number until the next sync?", and the rule for
skipping one is "would predicting it be expensive, ambiguous, or produce client
intent the server will overwrite anyway?".

Evidence for every server behavior below is in
[sync-api.md](../../internal/domain/zenmoney/sync-api.md), which is the durable
record of what live probing established.

## Rule status

| #   | Operation                             | Predicted locally    | Server also does                               |
| --- | ------------------------------------- | -------------------- | ---------------------------------------------- |
| 1   | patch on a `deleted` transaction      | implemented (ignore) | ignores it too (one-way ratchet)               |
| 2   | verified permanent-delete write       | implemented (purge)  | hard-purges the row, emits a real tombstone    |
| 3   | transaction money/account/date change | **planned**          | recomputes affected `account.balance`          |
| 4   | account deletion                      | **planned**          | hard-purges contained transactions             |
| 5   | transfer touching a deleted account   | **planned**          | converts to one-sided on the survivor          |
| 6   | tag deletion                          | **planned**          | nulls `transaction.tag`, drops its budget rows |
| 7   | merchant deletion                     | **planned**          | nulls `transaction.merchant`                   |
| 8   | merchant rename                       | **deliberately not** | rewrites `payee` + `changed` on linked rows    |

Rules 4, 5, and 7 have no local producer yet — Core emits no `deletion` for
account, tag, or transaction, only for reminders. They become reachable when
merchant and account deletion ship, and they are worth implementing then, not
before.

## 1. Deleted transactions are a ratchet

`deleted: true` is irreversible on the server: no later write, however fresh its
`changed`, resurrects the transaction. A direct `deletion` entry for a
transaction is converted into the same soft delete and produces no tombstone —
so a `deletion` entry is the wrong tool for removing a transaction outright;
rule 2 is the one that actually purges.

Core therefore soft-deletes transactions and the entity registry skips patches
against an already-deleted transaction (`skipExisting`). Nothing else may
recreate one under the same id — a hard-deleted id is a permanent tombstone
server-side, so ids are never reused.

## 2. The verified permanent-delete write purges the row

Writing both amounts of an existing transaction as exactly `0.00001`, with the
same account on both sides, makes ZenMoney purge the row: the write response
carries a real
`{ object: 'transaction', id, stamp, user }` tombstone and a follow-up
`forceFetch` pull shows the transaction absent — not `deleted: true`, gone. This
is the exact shape verified by the live probe. Other account combinations and
other tiny values are not generalized into the rule: earlier probes saw
`0.0004` and `0.001` persist, and did not isolate whether magnitude or the
same-account shape triggered the purge.

`materializeCommand` therefore drops the entity from the patch and emits the
deletion instead. Three properties make this safe:

- **transport is unaffected.** `materializePrimaryCommand` still sends the
  exact amount upsert, because that write is what triggers the purge. Sending a
  `deletion` entry instead would only soft-delete the row (see rule 1), so the
  predicted effect must never leak into the request.
- **undo needs no special case.** Undo drops the last command and replays the
  rest over `base`, which still holds the original full entity, so the predicted
  removal reverses itself.
- **it fires only for the verified transition.** The prediction applies to an
  existing visible row written as `0.00001`/`0.00001` on the same account —
  never on a create, an already-hidden row, or an unverified account shape.

Without this rule the verified row survives in `current` until the next sync.
The read models already hide tiny rows through their own historical threshold,
but "show deleted transactions" deliberately reveals them and would surface the
row as a nonsense transfer. Unverified shapes intentionally keep that temporary
behavior until a canonical response establishes what the server did.

## 3. Balances follow transactions

`account.balance` submitted by a client is ignored; the server recomputes it and
creates no correction transaction. The observed formula for cash, checking, and
ccard accounts:

```txt
balance = startBalance + sum(income) - sum(outcome)
```

Details that the prediction must honor:

- future-dated transactions count immediately;
- `hold` does not affect the balance;
- `opIncome`/`opOutcome` and their instruments are stored but excluded;
- `creditLimit` neither participates nor caps the balance;
- deposit and loan accounts showed an observed base of 0, and the debt formula
  is not established — do not predict those two;
- moving a transaction between accounts recalculates both sides;
- soft-deleting a transaction returns its contribution atomically;
- a row purged by rule 2 contributes nothing, so source transactions through the
  same non-deleted filter the read models use. Summing raw entity maps would
  briefly count amounts the server has already removed.

Until this rule lands, edits leave `account.balance` stale until sync — an
accepted risk in [design-ledger.md](./design-ledger.md).

## 4–5. Account deletion purges and rewrites

Deleting an account is another true purge path: transactions contained in it
are hard-deleted (even one created in the same request) and real `deletion[]`
tombstones are published. A transaction that also references a surviving
account is not purged; the deleted side is nulled, so a transfer becomes
one-sided income or outcome on the survivor.

A local prediction must reproduce both branches, otherwise the UI shows
transactions belonging to an account that no longer exists.

## 6. Tag deletion has two effects

Deleting a tag nulls `transaction.tag` on referencing transactions **and**
removes the budget rows keyed to that tag. The second half is easy to forget:
ZenMoney budgets are identified by `(user, tag, date)` and have no id, so their
removal is invisible in the deletion array.

Note also that budgets have no real delete of their own — a `deletion` entry
no-ops and zeroing is the only removal.

## 7–8. Merchant: rename is soft, unlink is not

This is the case where Core intentionally diverges from the server.

**Rename** (`merchant.title`). Core changes the merchant row and nothing else.
The server, however, rewrites `payee` and bumps `changed` on every linked
transaction; `originalPayee` is left alone. Consequences to keep in mind:

- do **not** predict that rewrite locally — it would turn one rename into
  hundreds of transaction intents, and every one of them would be client
  intent the server is going to write anyway;
- read paths must resolve the display name through the merchant id, so the new
  title appears immediately without touching transaction rows. The ZenMoney
  client does exactly this (`COALESCE(merchant.lowerTitle, lowerPayee)`), and
  Core's debtor/balance read models already prefer merchant title over
  `transaction.payee`;
- the next pull will therefore carry a large canonical diff of transactions
  whose only change is `payee` and `changed`. That is expected, not a conflict;
- because those rows arrive with a fresh server `changed`, a pending local edit
  on the same transaction is rebased over them under the usual
  last-write-wins-in-command-order policy.

**Unlink or delete.** The server nulls `transaction.merchant` on referencing
rows. The ZenMoney client additionally clears `payee`/`lowerPayee` locally and,
in transfer/debt-shaped cases, deletes referencing rows outright. Two things are
still unresolved and must not be encoded as invariants yet:

- one resumed probe pull showed a deleted merchant with a surviving
  `payee`/merchant reference on the linked transaction, which contradicts the
  clean-cascade reading and needs an isolated re-check;
- whether `payee` should survive locally. Treat `payee` as a historical string
  that a merchant deletion does not erase, and confirm against a real response
  before shipping the deletion command.

`originalPayee` is not a copy of the current name: the server fills it from
`payee` at creation time and never updates it on rename.

## What Core deliberately does not predict

- Server canonicalizations that only normalize a value we already sent:
  negative `outcome` becoming absolute, an instrument mismatch coerced to the
  account's instrument without FX, decimals kept unrounded. These belong in
  pre-flight validation and in the wire types, not in predicted state.
- Anything ZenMoney refuses outright (`income == outcome == 0`, dictionary
  writes, a second debt account). Rejection is a validation concern.
- Reminder markers for created reminders: the diff endpoint generates none.
- Field-level silent drops (dangling `tag` → null, tag self-parent, debt
  `instrument`, marker `state: 'deleted'`). Predicting them would hide a bug
  in the command that produced them.

## Verification requirements

Each rule lands as its own commit and must:

1. assert the materialized patch **and** the resulting state;
2. cover batches, upsert creation, deletion, and repeated writes on one field;
3. keep the predicted effect out of `buildOutboxTransport` output;
4. leave `applyPatch` dumb and canonical diffs unmaterialized;
5. compare against a real ZenMoney response where one exists — recording which
   response became the fixture.
