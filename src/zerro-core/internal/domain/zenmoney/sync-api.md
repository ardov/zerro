# Observed ZenMoney sync behavior

This reference summarizes recorded probes from July–August 2026, including
round 9 on August 30. These are observations from a disposable account, not a
complete server specification or a fresh live check. Untested account types and
server configurations may behave differently.

Probe scripts and sanitized evidence are under
`experiments/zenmoney-api-probe/`; Android-client observations refer to
`experiments/26.6b1-analysis/` (client 26.6b1). These local experiment directories
are not part of the public repository. No token or raw account response belongs
in this document.

## Cursor and entity versions

`serverTimestamp` is a read cursor. Mutable entities are accepted only when
`changed` is newer than the stored entity version; equal or older writes are
silently ignored. Advancing the cursor does not invalidate pending edits.

On acceptance the server stores its own clock, but the write response echoes
the submitted `changed`. A later pull reveals the stored version. Both
`serverTimestamp` and `currentClientTimestamp` are required;
`currentClientTimestamp` must be at least the newest submitted `changed`.
The server may return a client-time correction.

The read boundary is exclusive: an entity at time T appears from cursor T−1,
not T. The response cursor follows server time even without data changes.
Zerro overlaps incremental pulls by one second (`getSyncCursor` in
`src/store/data/selectors.ts`) to cover writes within the same second and
reapplies that overlap idempotently.

The inspected Android client uses sync-start time as its upload cursor and
sends the non-DST timezone offset in minutes. Zerro omits the optional offset.

## Responses and acknowledgements

HTTP 200 does not prove every item or field was accepted. A mixed batch can
return accepted entities without listing version-rejected ones; some invalid
fields are silently dropped while other fields apply.

Zerro applies each successful Chunk response and retires the items in its
receipt without checking field satisfaction. A silently rejected write may
therefore be lost. The remaining Outbox is replayed over the new base; accepted
Chunks are persisted before the next request. See
[the sync pipeline](../../../support/documents/architecture.md#sync-and-conflicts).

## Batch semantics

- Tested invalid upsert batches returned HTTP 400 without applying any upsert.
  Rollback of deletions sent alongside an invalid upsert remains untested.
- Intra-batch references resolve together, regardless of JSON key order.
- Deletion wins over an upsert of the same id. Observed behavior is consistent
  with upserts first, deletions next, then cascade cleanup.
- Duplicate ids within an entity array returned HTTP 500 with no applied write.
- Unknown fields are stripped. String-typed numbers are rejected; negative
  amounts become absolute. Submitting both amounts as exactly zero is rejected.
- Invalid account and merchant references cause HTTP 400. Dangling transaction
  tag references are dropped to null.

## Payloads that failed with HTTP 500

Recorded failures include duplicate ids, a zero-amount reminder, and a batch
of two reminders with roughly 2 KB and 8 KB comments containing NUL bytes,
emoji, and HTML/JSON-like text. The reminder failures stopped their probe
rounds; their precise causes were not isolated.

These observations establish neither a safe comment-size limit nor that size
alone caused the failure. Zerro's hidden data uses JSON reminder comments,
which escape control bytes. Reminder `points` is not a storage field.

## forceFetch

`forceFetch` returns named collections in full. Combined with a write, the
returned collection includes the accepted write.

In the inspected Android client, the requested collection set is durable and
additive. Those collections are excluded from uploads in that request, neither
sync cursor is committed while the set is non-empty, and success clears the
set only if it has not changed concurrently. Logout clears it. A local schema
migration was observed requesting `brand`. This describes that client, not a
Zerro repair workflow.

## Field mutability

| Field or entity                       | Observed behavior                                                                                                |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `account.balance`                     | Ignored on write; recomputed from transactions                                                                   |
| Ordinary account `instrument`         | Mutable without converting the balance; transaction instruments are coerced to the account instrument without FX |
| Ordinary account `type`               | Cash/checking/ccard transitions accepted; a second debt account rejected                                         |
| Account creation                      | Cash/checking/ccard accepted; emoney rejected; deposit/loan require their schedule and interest fields           |
| Entity `user`                         | Immutable; changes rejected                                                                                      |
| `instrument`, `company`               | Read-only; full dictionaries returned in tested accounts                                                         |
| `transaction.date`                    | Mutable; moving between accounts recalculates both balances                                                      |
| `transaction.created`                 | Accepted on creation, unchanged by later writes                                                                  |
| Tag `parent`                          | Required, null allowed; self-reference dropped; no depth limit found                                             |
| Tag `color`                           | No validation observed                                                                                           |
| `user.monthStartDay`, `user.paidTill` | Client writes accepted                                                                                           |

Deposit/loan creation required `startDate`, `endDateOffset`,
`endDateOffsetInterval`, `capitalization`, `percent`, and `payoffStep`.
The backup compatibility guard still checks required dictionary ids locally;
full dictionary delivery in a probe is not a reason to remove that guard.

## Deletion semantics

Deletion entries require `user` and `stamp`, but the submitted stamp is not a
version gate. The server stores its own stamp. Missing ids and mismatched
`object` names are no-ops. A hard-deleted id remains tombstoned and cannot be
reused. Tombstones reach other clients through `deletion` in incremental pulls.

### Transactions

A direct transaction deletion becomes a soft delete, with no tombstone.
`deleted: true` is irreversible under that id, even with a fresh `changed`.

An amount upsert can instead hard-purge a row when both amounts round to zero
at four decimals. This worked for creation and updates, one or two accounts,
and debt operations. It is distinct from submitting literal zero/zero, which
fails validation before rounding.

| Submitted income / outcome | Stored income / outcome        | Result   |
| -------------------------- | ------------------------------ | -------- |
| `0.00001 / 0.00001`        | both zero, inferred from purge | Purged   |
| `0.00004 / 0.00004`        | both zero, inferred from purge | Purged   |
| `0.00004 / 0.001`          | `0 / 0.001`                    | Retained |
| `0.00005 / 0.00005`        | `0 / 0.0001`                   | Retained |
| `0.00009 / 0.00009`        | `0.0001 / 0.0001`              | Retained |

The mixed survivor confirms rounding below `0.00005`. Rounding exactly at that
boundary remains unresolved. Core predicts purge only below the unambiguous
boundary; transport still sends the amount upsert, not the predicted deletion.

### Account cascades

Deleting an account purges transactions wholly contained in deleted accounts,
including one created in the same request. A transfer with an ordinary surviving
account becomes one-sided: both account fields name the survivor, the removed
side's amount becomes zero, and the survivor's balance is unchanged.

When the survivor is the debt account, the server instead soft-deletes the row,
nulls the removed account leg, keeps both amounts, and removes its balance
contribution. No transaction tombstone is emitted. Null account legs are thus
valid canonical state on soft-deleted rows. Tag behavior in this debt case was
not tested.

### Tag and merchant cascades

Deleting a tag nulls the tag on tested single-tag transactions, preserves their
balances, and removes matching budget rows. Multi-tag and reminder/marker tag
cascades remain unverified.

Deleting a merchant clears `merchant` and `payee` on linked ordinary
transactions, reminders, and markers. Transaction `originalPayee` survives.
An active debt transaction prevents the merchant deletion; after that
transaction is soft-deleted, merchant deletion succeeds and purges the debt row.
A cash transfer was already stored without tag, merchant, or payee links before
these deletion checks.

## Debt account

The debt account is a protected singleton: a second one is rejected and deleting
it is a no-op even without transactions. Its instrument is pinned; title and
`inBalance` are mutable. Debt transactions and reminders require a non-null
payee; merchant alone does not satisfy that requirement. Debt-to-debt reminders
are rejected, so the debt account cannot carry self-referencing hidden data.

## Merchants and payee

Renaming a merchant updates linked transaction `payee` and `changed`, retaining
`originalPayee`. The server does not infer a merchant from a matching payee.
Zerro resolves display names through the merchant rather than predicting a
rename across the transaction history.

On transaction creation, a non-null payee supplies `originalPayee`, even when
null was submitted. Payee edges are trimmed; Unicode and embedded newlines
survive. Empty payee and comment strings become null. Merchant titles are not
trimmed or case-folded; empty and duplicate titles were accepted.

## Reminders, markers, budgets

- Tested monthly, weekly, and notify reminders generated no markers through
  the diff endpoint. Markers are directly writable and may include `isForecast`.
  Writing marker state `deleted` is ignored; removal uses `deletion`.
- One-shot reminders normalize `step` to zero. Recurring reminders require a
  positive step. Accepted `points` came back as `[0]`, including an empty input;
  arrays longer than `step` were rejected. Null end dates and end dates before
  start dates were accepted.
- A second marker for the same reminder/date was silently rejected once;
  uniqueness remains a hypothesis.
- Budget identity is `(user, tag, date)`, not a server id. Upserts replace the
  row; mid-month dates are separate rows. Direct deletion is a no-op. Zeroing
  clears its amounts; deleting its tag removes the row.

## Required fields and omission defaults

The create matrix omitted one field at a time from a complete fixture and read
back successful writes. “Required” means the key must be present, sometimes
with null. These defaults describe those fixtures, not general client defaults.

| Entity           | Required by presence                                                                                                                                                                                                                                                                             | Verified defaults on omission                                                                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `merchant`       | `id`, `changed`, `user`, `title`                                                                                                                                                                                                                                                                 | none                                                                                                                                                                                  |
| `tag`            | `id`, `changed`, `user`, `title`, `showIncome`, `showOutcome`, `parent`                                                                                                                                                                                                                          | `icon: null`, `budgetIncome: false`, `budgetOutcome: false`, `archive: true`, `color: null`, `required: null`, `staticId: null`, `picture: null`                                      |
| `account` (cash) | `id`, `changed`, `user`, `instrument`, `title`, `role`, `company`, `type`, `syncID`, `balance`, `startBalance`, `creditLimit`, `inBalance`, `enableSMS`, `archive`, `private`                                                                                                                    | `savings: null`, `enableCorrection: true`, `balanceCorrectionType: 'request'`, all loan/deposit fields `null`                                                                         |
| `transaction`    | `id`, `changed`, `created`, `user`, `deleted`, `incomeBankID`, `outcome`, `outcomeInstrument`, `outcomeAccount`, `outcomeBankID`, `opIncome`, `opIncomeInstrument`, `opOutcome`, `opOutcomeInstrument`, `tag`, `date`, `comment`, `payee`, `merchant`, `latitude`, `longitude`, `reminderMarker` | `hold: null`, `viewed: true`, `source: null`, `qrCode: null`, `income: 0`, `incomeInstrument: 2`, absent `incomeAccount` copies `outcomeAccount`, `mcc` absent, `originalPayee: null` |
| `budget`         | `changed`, `user`, `tag`, `date`, `income`, `incomeLock`, `outcome`, `outcomeLock`                                                                                                                                                                                                               | `isIncomeForecast: false`, `isOutcomeForecast: false`                                                                                                                                 |
| `reminder`       | `id`, `changed`, `user`, `outcomeInstrument`, `outcomeAccount`, `tag`, `merchant`, `payee`, `comment`, `interval`, `step`, `points`, `startDate`, `endDate`                                                                                                                                      | `incomeInstrument: 2`, absent `incomeAccount` copies `outcomeAccount`, `notify: false`                                                                                                |
| `reminderMarker` | `id`, `changed`, `user`, `outcomeInstrument`, `outcomeAccount`, `outcome`, `tag`, `merchant`, `payee`, `comment`, `date`, `reminder`, `state`                                                                                                                                                    | `incomeInstrument: 2`, absent `incomeAccount` copies `outcomeAccount`, `income: 0`, `notify: false`                                                                                   |

Reminder income/outcome were not omitted because the zero-amount shape had
returned HTTP 500. Their omission behavior is unknown.

Transaction writes require full entities, including many null fields. Sparse
`id + changed + viewed` and a larger partial shape were rejected. `source` may
be omitted and returns as null; submitted `mcc: null` may disappear. Empty and
null comments represent the same intent.

## Snapshot compatibility

Complete snapshots also contain:

- string or number bank-operation ids, unrelated to company ids;
- account `balanceCorrectionType` values `request`, `createCorrection`, and
  `disabled`, and nullable `savings`;
- nullable reminder `endDate`, merchant `mcc`, and user `subscription`;
- budget forecast flags and marker `isForecast`.

A budget can survive its tag, and a marker can survive its reminder. Zerro
accepts those canonical orphans with loss-awareness warnings, but omits them
from restore/push writes because the endpoint refuses to recreate them.
Transactions referring to an omitted marker are written with a null reference.
The all-zero global budget tag id is valid and is not an orphan.

No unknown top-level collections appeared in the tested full sync. Candidate
bank-connection, loan, SMS, suggestion, and subscription collection names were
rejected by forceFetch. This does not rule out conditional collections.

## Local prediction and rebase

Money changes returned recalculated accounts; viewed/comment-only changes did
not. Zerro predicts selected effects locally, then accepts the canonical server
output. See [materialization rules](../../../support/documents/materialization.md).

Before pushing pending intent, Zerro pulls canonical changes, replays sparse
intent over the updated base, and sends full primary entities with fresh
versions. The recorded rebase preserved a remote amount change from 7 to 11
while applying pending `viewed=false`: an old version was ignored, a fresh one
was accepted. Chunk receipts govern acknowledgement, as described above.
