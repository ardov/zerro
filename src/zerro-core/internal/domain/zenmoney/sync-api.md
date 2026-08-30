# ZenMoney sync API behavior

This document records behavior observed against a disposable ZenMoney account
in five probe rounds (2026-07-16, 2026-07-19, 2026-07-24, 2026-07-25, and
2026-08-01 to 2026-08-02). It complements the public API documentation where
the live endpoint behaves more narrowly or exposes additional fields.

The reproducible probes and sanitized evidence live under
[`experiments/zenmoney-api-probe`](../../../../experiments/zenmoney-api-probe/);
its [REPORT.md](../../../../experiments/zenmoney-api-probe/REPORT.md) keeps the
experiment limits and the plan for closing unknowns. Rules recovered from the
official Android client 26.6b1 are marked as such and come from
[`experiments/26.6b1-analysis`](../../../../experiments/26.6b1-analysis/REPORT.md).
Raw account responses and the bearer token are not stored in the repository.

Everything here describes one endpoint and one account. An absent collection or
rule is not proof of absence for family, private, paid, or server-only
scenarios.

## Cursor and entity versions

- `serverTimestamp` is a cursor for reading server changes. It is not a cutoff
  for accepting client writes.
- Each mutable entity is compared by its own `changed` value. A write with an
  older or equal value is silently ignored; only a newer value is accepted.
- The submitted `changed` is only an ordering gate. On accept, the server
  discards it and stamps its own clock — while the write response echoes the
  _submitted_ value back. The comparison for the next write runs against the
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
- The cursor boundary is effectively exclusive: an object with `changed = T`
  appears at cursor `T - 1` but not at cursor `T`.
- The cursor tracks the server's wall clock and grows without any writes; it is
  not `max(changed)` of the returned objects.

Because the cursor and per-entity versions are independent, a background pull
may advance `serverTimestamp` without invalidating an older pending edit. Before
sending that edit, Zerro must rebuild the full entity over the latest canonical
version and assign a fresh `changed` value.

The last two bullets together also mean a change another client commits in the
same second as our response can never appear in a later incremental pull. Zerro
therefore sends the accepted base cursor minus one second (`getSyncCursor` in
`store/data/selectors.ts`) and re-applies that second of overlap idempotently.
The official client hedges the same way in the other direction: it commits its
local upload cursor as the time the sync _started_, not the response time.

The client also sends `currentClientTimezoneOffset` (`ZONE_OFFSET / 60000`,
without `DST_OFFSET`). The server does not require it and Zerro omits it.

## Responses and acknowledgements

ZenMoney can return HTTP 200 while silently rejecting an entity with an older
or equal `changed`. In a mixed batch, the response contained accepted entities
only and no rejection list.

Therefore HTTP success does not prove that every requested field was accepted.
Zerro deliberately accepts that risk: it applies the canonical response and
acknowledges the whole sent prefix without per-field satisfaction checks. This
keeps one stable commit boundary; a silently rejected write may be lost.

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
- Unknown entity fields are silently stripped. There is no type coercion:
  string-typed numbers are rejected with 400. Negative amounts are coerced to
  their absolute value; `income == outcome == 0` is explicitly rejected.
- `account` and `merchant` relations are hard-validated (400 naming the bad
  relation); dangling `tag` ids are silently dropped to `null` instead.

Because a validation error is atomic, a single malformed local intent makes
every subsequent sync fail identically. A client must not rely on the server to
sort valid from invalid work.

## Never send these shapes

Two payloads returned HTTP 500 during probing and must not be reproduced. Both
halted their round by design, so their exact cause is not isolated.

- a reminder with `income == 0 && outcome == 0` (a control pull confirmed the
  500 write did not apply);
- one batch carrying two ordinary reminders with mixed comments of roughly 2 KB
  and 8 KB, including NUL bytes, emoji, and HTML/JSON-like text.

The second shape matters because Zerro stores hidden data in reminder comments.
Small comments work, and Zerro's own production comments are multi-KB JSON
produced by `JSON.stringify`, which escapes control bytes — so size alone is
unlikely to be the trigger. Until the cause is isolated in a disposable
environment, do not treat a kilobyte-scale reminder comment as guaranteed-safe
storage, and never use `points` to carry data.

Duplicate ids inside one entity array also return 500 (see batch semantics).

## forceFetch

`forceFetch` names collections to be returned in full. A write combined with
`forceFetch` in one request returns the full entity list with the write already
applied.

How the official client uses it, which is the useful part for Zerro:

- the set is durable, stored as a comma-separated `ReloadEntities` preference,
  additive, and cleared on logout;
- collections listed in `forceFetch` are excluded from the local changes
  uploaded in that same request;
- neither the server cursor nor the local change cursor is committed while the
  set is non-empty, so a force-fetch round never lets the cursor skip the rows
  it deliberately did not upload;
- the set is cleared after a successful sync only if it still equals what was
  sent, so concurrent additions survive;
- the observed trigger is a local schema migration: reaching local DB version 11
  schedules a full refetch of `brand`.

That makes `forceFetch` the natural repair mechanism for a client whose local
format changed — the analogue for Zerro being a hidden-data or replica format
migration that needs canonical reminders re-read.

## Field mutability

- `account.balance` submitted by a client is ignored — the server recomputes
  it from transactions. No correction transaction is created.
- `account.instrument` is freely mutable on ordinary accounts and the balance
  number is kept as-is (no conversion) — effectively re-denominates the
  account. Transaction instruments that mismatch their account are silently
  coerced to the account's instrument, without FX.
- `account.type` transitions between ordinary types (cash/checking/ccard) are
  unrestricted; transitions into `debt` are blocked while a debt account
  exists. A client may create `cash`, `checking`, and `ccard`; `emoney`
  creation is rejected, and `deposit`/`loan` additionally require
  `startDate`, `endDateOffset`, `endDateOffsetInterval`, `capitalization`,
  `percent`, and `payoffStep`.
- `user` on any entity is immutable (explicit 400). Dictionaries
  (`instrument`, `company`) are read-only (explicit 400) and are delivered in
  full to every account rather than narrowed to what that account uses, so a
  reference to any of their ids resolves for anybody. The restore compatibility
  guard still checks that a backup's referenced dictionary ids are present
  locally, but under this observed behaviour it is a protective guard rather
  than an expected cross-account failure.
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
  value. The request-side entry nonetheless requires `user` and `stamp` to be
  _present_ — omitting either is a `400 validationError`, independent of
  whether their values are ever compared.
- Bogus deletions (nonexistent id, or wrong `object` for an existing id) are
  silent no-ops; `(id, object)` acts as a compound lookup key.
- A hard-deleted id is a permanent tombstone: a later upsert of the same id is
  silently rejected forever (the response re-echoes the tombstone). Never
  reuse ids.
- Deletions propagate to other clients via the top-level `deletion` array in
  incremental pulls.
- Cascades: deleting a tag nulls `transaction.tag` on referencing transactions
  and removes budget rows keyed to that tag. Round 6.1 (2026-08-02) confirmed
  the transaction half on a disposable single-tag income and outcome: both
  rows survived, their `tag` became `null`, and the account balance was
  unchanged. Round 6.2 independently confirmed that a matching full budget
  row is removed, not zeroed. It does not yet establish multi-tag or
  reminder/marker behavior.
  Round 6.3 (2026-08-02) re-checked merchant deletion in clean fixtures:
  ordinary transactions, reminders, and markers survive with both `merchant`
  and `payee` set to `null`; a transaction retains `originalPayee`. A cash
  transfer stores neither merchant nor payee. An active debt transaction is
  different: the merchant deletion is a silent no-op and both rows remain.
  Round 6.4 then soft-deleted each form before a separate merchant deletion:
  the deleted ordinary row was rewritten (`merchant`/`payee` null,
  `originalPayee` retained); the transfer had no stored link; and the deleted
  debt row was hard-purged when its merchant could finally be deleted.
- A direct `deletion` entry naming an existing transaction is converted to an
  ordinary soft-delete (or no-ops if already soft-deleted) and produces no
  `deletion`-array tombstone. `deleted: true` reached this way is a one-way
  ratchet — no later write, however fresh its `changed`, can resurrect the
  transaction.
- **Purge by zeroed amounts is real, through a different path.** Amounts are
  stored with four decimals, and a transaction whose `income` and `outcome`
  are _both_ stored as zero is hard-purged: the write response's `deletion[]`
  carries a genuine `{ object: 'transaction', id, stamp, user }` tombstone, and
  a follow-up `forceFetch` pull confirms the row is gone — not
  `deleted: true`, actually absent. This is a distinct code path from the
  direct-`deletion`-entry case above: an upsert can trigger a real hard purge
  that a `deletion` array entry on the same id cannot.

  Round 7 (2026-08-02, `experiments/zenmoney-api-probe/round7`) retired the
  earlier reading of this, which had only seen a rewrite of an existing row to
  `0.00001`/`0.00001` with `incomeAccount == outcomeAccount` (round 5,
  2026-07-25) and left magnitude versus same-account shape open. Neither is the
  trigger. The purge fires on a create as much as on a rewrite, across two
  different accounts as much as one, with the debt account on a side, and with
  or without a merchant and payee. Rounds 7b and 7c then mapped the boundary:

  | sent                | stored            | fate     | round |
  | ------------------- | ----------------- | -------- | ----- |
  | `0.00001`/`0.00001` | `0`/`0`           | purged   | 5, 7  |
  | `0.00004`/`0.00004` | `0`/`0`           | purged   | 7c    |
  | `0.00004`/`0.001`   | `0`/`0.001`       | survived | 7c    |
  | `0.00005`/`0.00005` | `0`/`0.0001`      | survived | 7c    |
  | `0.00009`/`0.00009` | `0.0001`/`0.0001` | survived | 7b    |
  | `0.0004`, `0.001`   | unchanged         | survived | 5     |

  The mixed row carries the proof: a purged row shows nothing, so only a
  survivor can demonstrate that `0.00004` really is stored as `0` — and that
  one zeroed side is not enough.

  `0.00005` is recorded as an observation, not a rule. The same submitted value
  stored as `0` on the income side and `0.0001` on the outcome side within one
  write, so the rounding at exactly half is unresolved. Treat only amounts
  below `0.00005` as unambiguously stored as zero.

  This does not contradict `income == outcome == 0` being rejected: that
  validation runs on the submitted numbers, before rounding. Sending `0`/`0` is
  a 400 that writes nothing, while `0.00001`/`0.00001` is an accepted write
  that then purges.

- A second real purge path is the account-deletion cascade: deleting an
  account hard-purges transactions contained in it (even one created in the
  same request) and emits genuine `deletion[]` tombstones for them.
  Transactions that also reference a surviving account are not purged. Round 6
  (2026-08-01) verified both directions: the survivor id is copied into both
  account fields, the amount on the deleted side becomes `0`, and the survivor
  balance is unchanged by the cascade. This turns the transfer into one-sided
  income or outcome without a dangling account reference. A separate tagged
  fixture first confirmed its tag by forceFetch, but the cash transfer was
  already canonicalized to `tag: null` before account deletion: category is
  stripped by transfer materialization, not this cascade.

- That collapse is not universal. Round 9 (2026-08-30) measured the case where
  the surviving leg is the debt account, which cannot take both sides of a row.
  The server soft-deletes the operation instead: `deleted` becomes `true`, the
  leg that pointed at the deleted account becomes **`null`**, and both amounts
  are kept as they were. No `deletion[]` tombstone is emitted, but the
  rewritten row arrives in the same response as the account deletion. The debt
  account's balance loses the operation's contribution. So a dangling — in
  fact null — account reference is real canonical state, on soft-deleted rows
  only; `tag` behaviour here is untested, since the fixture carried none.

## Debt account

- Deleting an ordinary account does not collapse a debt operation onto the
  debt account; it soft-deletes the row and nulls the freed leg. See the
  account-deletion cascade above.
- The debt account is a protected singleton: creating a second one is blocked
  (same 400 for fresh creation and for changing an existing account's type),
  and deleting it is a silent no-op even with zero referencing transactions.
- Its `instrument` is silently pinned (field-level drop); `title` and
  `inBalance` mutate freely.
- Debt transactions require a non-null `payee`; `merchant` alone never
  satisfies the requirement (explicit 400). On accept, the server populates
  `originalPayee` from the submitted `payee`.

## Merchants and payee

- Renaming a merchant updates `payee` and `changed` on every linked
  transaction, but leaves `originalPayee` untouched. One rename can therefore
  produce a large canonical diff of transactions whose only change is the
  payee string.
- The server never derives a merchant from `payee` and never attaches an
  existing merchant by matching title. `payee` and `merchant` can be
  desynchronized in both directions.
- On create with a non-null `payee`, the server writes `originalPayee = payee`
  even when `originalPayee: null` was submitted; with a null payee it stays
  null.
- Deleting a merchant clears `merchant` and `payee` on linked ordinary
  transactions, reminders, and markers, while preserving transaction
  `originalPayee`. It does not delete the merchant while an active debt
  transaction references it; that request is a silent no-op. After the debt
  transaction is soft-deleted, merchant deletion succeeds and hard-purges that
  deleted debt row.
- `payee` is trimmed at the edges but keeps Unicode and embedded newlines;
  `comment: ""` and `payee: ""` are stored as `null`. Merchant `title` is not
  trimmed, not case-folded, and not unique — empty and duplicate titles are
  accepted.
- Consequence for Zerro: resolve display names through the merchant id instead
  of rewriting `transaction.payee` locally. See
  [materialization.md](../../../support/documents/materialization.md).

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
- Reminder scheduling is canonicalized: a one-shot reminder (`interval: null`)
  normalizes `step` to 0, while a recurring one requires a positive step
  (negative and zero are invalid). Empty `points` becomes `[0]`, and in every
  accepted check `points` came back as `[0]`; an array longer than `step` is a 400. `endDate < startDate` and `endDate: null` are accepted.
- A reminder touching the debt account requires a non-null `payee`;
  debt→debt is rejected regardless of amounts, while a mixed debt/ordinary pair
  is accepted. Self-referencing reminder storage therefore cannot live on the
  debt account.
- A second marker for the same `(reminder, date)` was silently rejected —
  treated as a uniqueness hypothesis, not a proven constraint.

## Required fields and omission defaults

A round-4 create matrix removed exactly one field at a time from a full safe
fixture for every writable collection and read the stored state back after each
HTTP 200. "Required" below means the wire key must be **present**; it may still
be null (`role` and `company` were sent as null). Every 400 was a clean
`validationError`.

| Entity           | Required by presence                                                                                                                                                                                                                                                                             | Verified defaults on omission                                                                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `merchant`       | `id`, `changed`, `user`, `title`                                                                                                                                                                                                                                                                 | none                                                                                                                                                                                  |
| `tag`            | `id`, `changed`, `user`, `title`, `showIncome`, `showOutcome`, `parent`                                                                                                                                                                                                                          | `icon: null`, `budgetIncome: false`, `budgetOutcome: false`, `archive: true`, `color: null`, `required: null`, `staticId: null`, `picture: null`                                      |
| `account` (cash) | `id`, `changed`, `user`, `instrument`, `title`, `role`, `company`, `type`, `syncID`, `balance`, `startBalance`, `creditLimit`, `inBalance`, `enableSMS`, `archive`, `private`                                                                                                                    | `savings: null`, `enableCorrection: true`, `balanceCorrectionType: 'request'`, all loan/deposit fields `null`                                                                         |
| `transaction`    | `id`, `changed`, `created`, `user`, `deleted`, `incomeBankID`, `outcome`, `outcomeInstrument`, `outcomeAccount`, `outcomeBankID`, `opIncome`, `opIncomeInstrument`, `opOutcome`, `opOutcomeInstrument`, `tag`, `date`, `comment`, `payee`, `merchant`, `latitude`, `longitude`, `reminderMarker` | `hold: null`, `viewed: true`, `source: null`, `qrCode: null`, `income: 0`, `incomeInstrument: 2`, absent `incomeAccount` copies `outcomeAccount`, `mcc` absent, `originalPayee: null` |
| `budget`         | `changed`, `user`, `tag`, `date`, `income`, `incomeLock`, `outcome`, `outcomeLock`                                                                                                                                                                                                               | `isIncomeForecast: false`, `isOutcomeForecast: false`                                                                                                                                 |
| `reminder`       | `id`, `changed`, `user`, `outcomeInstrument`, `outcomeAccount`, `tag`, `merchant`, `payee`, `comment`, `interval`, `step`, `points`, `startDate`, `endDate`                                                                                                                                      | `incomeInstrument: 2`, absent `incomeAccount` copies `outcomeAccount`, `notify: false`                                                                                                |
| `reminderMarker` | `id`, `changed`, `user`, `outcomeInstrument`, `outcomeAccount`, `outcome`, `tag`, `merchant`, `payee`, `comment`, `date`, `reminder`, `state`                                                                                                                                                    | `incomeInstrument: 2`, absent `incomeAccount` copies `outcomeAccount`, `income: 0`, `notify: false`                                                                                   |

`transaction.incomeBankID` and `transaction.outcomeBankID` are opaque IDs for
bank operations supplied by a synchronization plugin. They are not references
to `company` entities and may be non-null even when no matching company row is
present.

Reminder `income` and `outcome` were deliberately never omitted: the omission
could have produced the zero-amount 500 shape. That is a safety blind spot, not
evidence that the fields are optional.

Zerro sends full canonical entities from its own snapshot, so presence is
satisfied structurally. The defaults matter when comparing local state with what
the server actually stored — `viewed` in particular defaults to `true`, which is
why the local transaction factory does the same.

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
  its transfer into one-sided income or outcome on the surviving account,
  without changing that account's balance.
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
5. Apply the canonical response and acknowledge the whole sent prefix.
