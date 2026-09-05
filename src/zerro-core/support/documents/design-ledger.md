# Zerro Core design decisions

[Architecture](./architecture.md) explains the flow. This document records the
reasons and domain rules that are easy to lose during a refactor. Plans belong
in the private tracker; implementation history belongs in Git.

## One replica owner

Redux owns the browser replica. Core supplies pure Outbox operations rather
than another mutable engine object. This keeps append, undo, redo, replay, and
acknowledgement in one implementation without adding a second reactive store.

Core remains an internal source module with explicit entrypoints. A physical
package split would add release and compatibility work without changing the
current dependency boundary. `6-shared/types` remains a compatibility facade
for normalized types; consumers can move gradually.

The journal is linear because startup, history selection, and retention can
then share one replay model. A full reload appends a checkpoint rather than
starting a branch. The storage format and tradeoffs are in
[ADR 0001](../../../../docs/adr/0001-linear-indexeddb-replica.md).

## Reads and Redux adapter

The session and Redux adapter instantiate the same projection graph. Defining
the wiring once prevents two consumers from calculating different financial
results. Memoization follows the lifetime of the consumer, not a separate
reactive Core store.

Cheap allocating nodes may need caching to keep their dependents stable.
`inBudgetAccountIds` additionally compares the resulting IDs, so an account
rename does not invalidate transaction activity. Primitive and pass-through
reads do not earn a cache merely by being graph nodes.

Activity projections retain amounts and counts, not transaction arrays. Lists
query transaction history on demand. Query clauses combine with AND, values
within a clause with OR; activity filters share the activity routing projector.

Display labels and domain identities are separate. Localized group names are
mapped back to stable IDs before command compilation. The adapter's
`commandRead.ts` reads the shared graph without importing namespace modules
that re-export commands and would create cycles.

## Commands and synchronization

Sparse absolute intent is small enough to persist and can replay against a
new base. Separate durable create/update command variants are unnecessary:
missing IDs create, present IDs update. Writable field lists describe domain
capabilities, not just fields currently exposed by the UI.

Primary transport and local effects use separate replay paths. For example,
zeroed transaction amounts may predict a local purge, but sending a deletion
instead of those amounts would ask ZenMoney for a different operation.
[Materialization](./materialization.md) owns the exact rules.

Background sync is pull-only because acknowledging commands also removes their
undo history. Pull preserves redo. A new command, deliberate push, push
acknowledgement, reload, or logout clears it; switching root user also clears
both stacks.

Large pushes are bounded and durably acknowledged Chunk by Chunk. Planning and
delivery live in Core; adapters supply HTTP, persistence, byte measurement, and
reporting. This keeps protocol rules out of UI orchestration.
[ADR 0002](../../../../docs/adr/0002-bounded-push-runs.md) owns that decision.

The entity reference graph is shared by validation, backup compatibility,
restore, and push sanitation. Read tolerance is separate from write validity:
ZenMoney may retain orphaned budgets and reminder markers that cannot be
recreated. Cleanup order records server behavior rather than assuming every
cascade is the reverse of an ordinary reference.

## Restore

[`buildRestorePlan`](../../internal/operations/restore/diffStores.ts) reconciles
`current` with a desired snapshot and returns an intent patch plus summary.
Preview uses temporary deterministic IDs. Apply recomputes against the live
snapshot with real IDs, since a pull may have arrived in between. Preview
counts are therefore not a guarantee of the eventual patch.

A canonical history restore and a backup restore use the ordinary command
path. They remain undoable before push and never truncate the canonical
journal. Restoring an unsent local position instead undoes to that Outbox
position. The current history and backup flows restore complete snapshots.

Identity rules:

- A live same-ID entity is updated in place. An absent backup ID is never
  reused: ZenMoney tombstones are permanent.
- Other eligible entities may reuse one exact semantic match; otherwise they
  get fresh IDs, with dependent references remapped.
- Accounts match only by ID. Reusing a resembling account would leave its old
  transactions as permanent soft-deleted rows; deleting it allows the server
  to purge contained operations. Consequently, repeated restore of a backup
  with absent account IDs rebuilds accounts rather than converging.
- The root user maps to the signed-in root, and the debt account remains the
  protected singleton. Hidden Zerro payloads are remapped with their entities.
- Desired soft-deleted transactions are skipped. Existing deleted transactions
  are not resurrected under their old IDs.

Removal follows each entity's protocol: soft deletion for transactions, zeroing
for budgets, real deletion for accounts, merchants, tags, reminders, and
markers; no user removal. The debt account and merchants referenced by active
debt transactions are protected. A transaction wholly inside accounts being
deleted needs no separate soft delete. The materializer predicts the supported
cascades locally; transport sends primary intent.

## Backup compatibility

A backup is a complete canonical snapshot. Export reads `base`, excludes local
Outbox commands, and never triggers sync. Restore also never pushes by itself.

Structural failures block restore: missing collections, malformed primitives,
duplicate identities, broken required references, cycles, and invalid root or
debt cardinality. Unknown fields and business values instead produce aggregated
warnings and an explicit “Restore anyway” choice. Acceptance of a file does
not imply that every unknown field is writable.

A different root user makes a backup foreign, not invalid. It requires explicit
confirmation and remaps owned entities into the signed-in root. Account
`syncID` values are retained for bank-statement matching. Reference dictionaries
are validated but never written; billing and subscription fields are excluded.

## History presentation

History order follows the replica: redo, local commands, canonical points.
A later pull sits beneath unsent commands even when its timestamp is newer.
The selected historical snapshot never replaces the live replica. Selecting
the live head normalizes to no selection, and an unavailable retained point is
reported instead of silently displaying live data.

Canonical rows summarize stored transitions without replay. Checkpoints have
no per-point diff. Local rows use optional command labels, falling back to the
materialized change. Labels do not survive as journal metadata after push.

A hidden-data reminder is summarized by its payload type. Counting entries
inside that payload requires both versions and belongs to the detailed diff,
where replay already occurs. Unparseable hidden data falls back to the raw
entity. Derived balances and activity are not a second source of history diffs.

## Accepted risks

- Upsert can recreate an entity deleted remotely while local intent is pending.
- HTTP success acknowledges the whole Chunk, including fields the server may
  silently reject. Returned field values are not used as per-item receipts.
- A multi-Chunk push is not atomic. Earlier Chunks remain accepted if a later
  one stops, and the first acknowledgement replaces original command history
  with the remaining intent.
- Restoring a deleted entity may require a new identity. A restore overwrites
  changes within its scope; it is not a way to recover server-side identity.
- Retention may remove old points, including the point preceding a restore.
  There is no special pin for that point.
- Browser persistence is best-effort after its first primary write failure.
  Multiple active tabs are not coordinated.

These are limits of the current model, not additional behaviors for callers to
implement. A change to them needs an explicit contract and regression coverage.
