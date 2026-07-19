# ZenMoney sync API behavior

This document records behavior observed against a disposable ZenMoney account
in two probe rounds (2026-07-16 and 2026-07-19). It complements the public API
documentation where the live endpoint behaves more narrowly or exposes
additional fields.

The reproducible probes and sanitized evidence live under
[`experiments/zenmoney-api-probe`](../../../../experiments/zenmoney-api-probe/)
(round 2: [`round2/results`](../../../../experiments/zenmoney-api-probe/round2/results/)).
Raw account responses and the bearer token are not stored in the repository.

## Cursor and entity versions

- `serverTimestamp` is a cursor for reading server changes. It is not a cutoff
  for accepting client writes.
- Each mutable entity is compared by its own `changed` value. A write with an
  older or equal value is silently ignored; only a newer value is accepted.
- The submitted `changed` is only an ordering gate. On accept, the server
  discards it and stamps its own clock — while the write response echoes the
  *submitted* value back. The comparison for the next write runs against the
  stored server-clock value, not against what was previously submitted. Only a
  follow-up pull shows the real stored entity; the write-response echo is not
  authoritative.
- `currentClientTimestamp` can be used by the server to return a time correction,
  but it does not replace per-entity version comparison.
- `currentClientTimestamp` must not be older than a submitted entity's
  `changed`. This matters when a write needs `current changed + 1 second` while
  the local wall clock is still in the previous second.
- Both envelope fields are strictly required; omitting either is a 400. There
  is no bootstrap call that hands out a cursor — a future or up-to-date
  `serverTimestamp` simply yields an empty diff, and the response's
  `serverTimestamp` is always the server's real position, never an echo.

This means a background pull may advance `serverTimestamp` without invalidating
an older pending edit. Before sending that edit, Zerro must rebuild the full
entity over the latest canonical version and assign a fresh `changed` value.

## Responses and acknowledgements

ZenMoney can return HTTP 200 while silently rejecting an entity with an older
or equal `changed`. In a mixed batch, the response contained accepted entities
only and no rejection list.

Therefore neither HTTP success nor the presence of an entity id in the request
acknowledges an outbox entry. The safe acknowledgement rule is:

1. Apply the response as canonical server data.
2. Check whether the sent local intent is satisfied by the new canonical state.
3. Remove only satisfied intents. Retain and rematerialize the rest, or expose a
   semantic conflict.

## Batch semantics

- Validation errors are atomic: one invalid entity rejects the whole request
  with HTTP 400 and nothing in the batch applies. Version-based rejections
  remain per-entity and silent. Duplicate ids inside one entity array crash
  with HTTP 500 (nothing applies) — never send them.
- Intra-batch references resolve as a set: a transaction may reference an
  account created in the same request, regardless of JSON key order.
- A `deletion` entry beats an upsert of the same id within one request, both
  for newly-created and pre-existing entities.
- Application order is three-phased: (1) all upserts validate and apply as a
  set against pre-request state — a reference to an entity that the same
  request deletes is still valid at apply time, even for hard-validated
  relations like budget→tag; (2) all `deletion` entries apply
  unconditionally; (3) a cascade pass cleans up what the deletions orphaned
  (nulls dangling `merchant`/`tag` refs, removes budget rows of a deleted
  tag, hard-purges transactions of a deleted account). Top-level key order
  between `deletion` and entity arrays never matters. Untested corner:
  whether a 400 batch rolls back `deletion` entries sent alongside the
  failing upsert.
- A write combined with `forceFetch` in one request returns the full entity
  list with the write already applied.
- Unknown entity fields are silently stripped. There is no type coercion:
  string-typed numbers are rejected with 400. Negative amounts are coerced to
  their absolute value; `income == outcome == 0` is explicitly rejected.
- `account` and `merchant` relations are hard-validated (400 naming the bad
  relation); dangling `tag` ids are silently dropped to `null` instead.

## Field mutability

- `account.balance` submitted by a client is ignored — the server recomputes
  it from transactions. No correction transaction is created.
- `account.instrument` is freely mutable on ordinary accounts and the balance
  number is kept as-is (no conversion) — effectively re-denominates the
  account. Transaction instruments that mismatch their account are silently
  coerced to the account's instrument, without FX.
- `account.type` transitions between ordinary types (cash/checking/ccard) are
  unrestricted; transitions into `debt` are blocked while a debt account
  exists.
- `user` on any entity is immutable (explicit 400). Dictionaries
  (`instrument`, `company`) are read-only (explicit 400).
- `transaction.date` is freely mutable (any distance); moving a transaction
  between accounts recalculates both balances atomically in the response.
- Tags: no server-side nesting depth limit; a self-referencing `parent` is
  silently dropped while other fields in the same write apply; `color` is
  unvalidated; `parent` must be present (null allowed) or the write is a 400.
- `user.monthStartDay` and `user.paidTill` are client-writable.
- A recurring pattern: some invalid field values (`tag` dangling refs, tag
  self-parent, debt `instrument`, marker `state: 'deleted'`) are silently
  dropped at field level while the rest of the write applies and `changed`
  advances. Acknowledgement checks must compare field-by-field, not assume a
  write applied wholesale.

## Deletion semantics

- Deletions are not version-checked: any `stamp`, however old, applies
  unconditionally. The stored stamp is the server's clock, not the submitted
  value.
- Bogus deletions (nonexistent id, or wrong `object` for an existing id) are
  silent no-ops; `(id, object)` acts as a compound lookup key.
- A hard-deleted id is a permanent tombstone: a later upsert of the same id is
  silently rejected forever (the response re-echoes the tombstone). Never
  reuse ids.
- Deletions propagate to other clients via the top-level `deletion` array in
  incremental pulls.
- Cascades: deleting a tag nulls `transaction.tag` on referencing transactions
  and removes budget rows keyed to that tag; deleting a merchant nulls
  `transaction.merchant`. No dangling references are left behind.
- Transactions can never be hard-deleted by a direct `deletion` entry: it is
  converted to an ordinary soft-delete (or no-ops if already soft-deleted)
  and no `deletion`-array tombstone is produced. `deleted: true` is a one-way
  ratchet — no later write, however fresh its `changed`, can resurrect the
  transaction.
- The one real purge path is the account-deletion cascade: deleting an
  account hard-purges transactions contained in it (even one created in the
  same request) and emits genuine `deletion[]` tombstones for them.
  Transactions that also reference a surviving account are not purged — the
  deleted side is nulled/converted instead (a transfer becomes one-sided on
  the survivor).

## Debt account

- The debt account is a protected singleton: creating a second one is blocked
  (same 400 for fresh creation and for changing an existing account's type),
  and deleting it is a silent no-op even with zero referencing transactions.
- Its `instrument` is silently pinned (field-level drop); `title` and
  `inBalance` mutate freely.
- Debt transactions require a non-null `payee`; `merchant` alone never
  satisfies the requirement (explicit 400). On accept, the server populates
  `originalPayee` from the submitted `payee`.

## Reminders, markers, budgets

- The diff endpoint does not server-generate `reminderMarker`s for created
  reminders (monthly, weekly, and notify variants all produced none). Markers
  are directly client-writable; their live shape includes `isForecast`.
  Setting marker `state: 'deleted'` by direct write is silently dropped —
  removal goes through the `deletion` array.
- Budgets have no id: identity is `(user, tag, date)` and upserts replace in
  place (the server's own error format uses `<tagId>#<date>` as the object
  id). Mid-month dates are accepted as independent rows. There is no true
  budget delete — `deletion` no-ops; zeroing is the only removal, except that
  deleting the tag removes its budget rows.

## Transaction wire shape

Transaction writes are effectively full-entity writes, not sparse patches.
`id + changed + viewed` was rejected because `user` was missing. A larger
documented subset was then rejected because `tag` was missing. Null-valued
fields generally need to be present.

`created` is accepted when a transaction is created but is not updated on an
existing transaction. Changing operation time therefore requires creating a
replacement under a new id and hiding the original.

Two fields behave asymmetrically:

- A full transaction without `source` was accepted; the response added
  `source: null`.
- A submitted `mcc: null` was omitted from the response.

ZenMoney also canonicalizes an empty transaction `comment` (`""`) to `null`.
Acknowledgement must treat those two values as the same user intent.

Accordingly, both fields are optional in the wire-compatible transaction type.
Zerro may still normalize `source` to `null` for locally created transactions.

## Server-side materialization

- Creating a transaction or changing its money fields returned affected
  accounts with recalculated balances.
- Changing only `viewed` or `comment` returned no account patch.
- Deleting an account permanently removed its non-transfer expense and changed
  its transfer into one-sided income on the surviving account.
- A soft-deleted transaction ignored a later, newer resurrection attempt.

Zerro should send primary entity changes and treat returned accounts and other
cascade effects as canonical server output. Client-materialized balance or
cascade effects must not be sent blindly alongside the primary transaction.

## Observed schema additions

The live response exposed fields that were missing or too narrow in the local
types:

| Entity           | Observed shape                                     |
| ---------------- | -------------------------------------------------- |
| `budget`         | `isIncomeForecast: boolean`                        |
| `budget`         | `isOutcomeForecast: boolean`                       |
| `transaction`    | `source` present as `null` in server responses     |
| `transaction`    | `mcc` may be omitted instead of returned as `null` |
| `account`        | `savings` may be `null`                            |
| `user`           | `subscription` may be `null`                       |
| `reminderMarker` | `isForecast: boolean` (undocumented)               |
| `tag`            | `parent` is required on writes (null allowed)      |

No unknown top-level collections appeared in a full sync. `reminderMarker` is a
valid entity name but was empty on the probe account. Candidate collections for
bank connections, loans, SMS, suggestions, and subscriptions were rejected as
unknown force-fetch entities. This is evidence for the tested endpoint and
account, not proof that conditional server-only collections never exist.

## Rebase sequence

The tested rebase case was a pending `viewed=false` intent over a remote amount
change from 7 to 11:

1. Sending the fresh full transaction with the intent's old `changed` was
   ignored.
2. Rebuilding the same full transaction with a fresh `changed` was accepted.
3. The remote amount 11 was preserved and `viewed=false` was applied.

The resulting sync order is:

1. Pull and apply canonical server changes to the base.
2. Rematerialize pending local intents over that base in order.
3. Encode full ZenMoney entities with fresh per-entity `changed` values.
4. Push primary changes.
5. Apply the canonical response and acknowledge intents by satisfaction.
