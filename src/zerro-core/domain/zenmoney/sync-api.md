# ZenMoney sync API behavior

This document records behavior observed against a disposable ZenMoney account
on 2026-07-16. It complements the public API documentation where the live
endpoint behaves more narrowly or exposes additional fields.

The reproducible probe and sanitized evidence live under
[`experiments/zenmoney-api-probe`](../../../../experiments/zenmoney-api-probe/).
Raw account responses and the bearer token are not stored in the repository.

## Cursor and entity versions

- `serverTimestamp` is a cursor for reading server changes. It is not a cutoff
  for accepting client writes.
- Each mutable entity is compared by its own `changed` value. A write with an
  older or equal value is silently ignored; only a newer value is accepted.
- The server rewrites `changed` on an accepted entity. The submitted timestamp
  must not be expected to round-trip unchanged.
- `currentClientTimestamp` can be used by the server to return a time correction,
  but it does not replace per-entity version comparison.
- `currentClientTimestamp` must not be older than a submitted entity's
  `changed`. This matters when a write needs `current changed + 1 second` while
  the local wall clock is still in the previous second.

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

| Entity        | Observed shape                                     |
| ------------- | -------------------------------------------------- |
| `budget`      | `isIncomeForecast: boolean`                        |
| `budget`      | `isOutcomeForecast: boolean`                       |
| `transaction` | `source` present as `null` in server responses     |
| `transaction` | `mcc` may be omitted instead of returned as `null` |
| `account`     | `savings` may be `null`                            |
| `user`        | `subscription` may be `null`                       |

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
