# Zerro Core architecture

Core is a set of domain functions over normalized ZenMoney data. Redux owns the
live state. HTTP, IndexedDB, React, localization, and assets stay in adapters.
The [glossary](../../../../CONTEXT.md) defines the domain terms.

## Replica model

There are two snapshots and two command stacks:

```ts
type ReplicaState = {
  base: TDataStore // latest canonical state accepted from ZenMoney
  current: TDataStore // replayOutbox(base, outbox)
  outbox: TCommand[] // applied commands not yet acknowledged
  redo: TCommand[] // undone commands, kept only in this session
}
```

`current` is derived, never a second source of truth. The Outbox is both pending
intent and the durable undo stack. The canonical journal separately retains
accepted server states; it reconstructs `base` at startup.

| Operation             | Effect                                                          |
| --------------------- | --------------------------------------------------------------- |
| Append                | Add one command, advance `current`, clear redo                  |
| Undo / redo           | Move commands between stacks and replay over `base`             |
| Pull                  | Update `base`, replay the Outbox, preserve redo                 |
| Begin deliberate push | Capture the Outbox prefix, clear redo                           |
| Accept Push Chunk     | Update `base`, retire its receipt, replay the remainder         |
| Reload                | Reconstruct `base` and Outbox from IndexedDB; redo starts empty |
| Logout                | Reset the live replica and clear persisted data in queue order  |

The pure operations are in
[`outbox.ts`](../../internal/operations/replication/outbox.ts). The Redux owner
is [`store/data/slice.ts`](../../../store/data/slice.ts). Appending applies only
the new command to `current`, preserving unrelated entity-map references;
undo, redo, and rebase replay the remaining Outbox.

## Change pipeline

```txt
user action -> concrete operations -> prepared command -> Outbox
base + Outbox -> materialization with predicted effects -> current
base + captured Outbox -> primary-only replay -> transport
```

### Commands

All durable commands use one envelope:

```ts
type Command = {
  issuedAt: TMsTime
  operations: Operation[]
  label?: TCommandLabel
}
```

A command is one undoable user action. Its ordered operations include entity
creation and editing (`transaction.create`, `transaction.patch`, and equivalent
operations for writable entities), `entity.delete`, and domain operations such
as `budgets.set`, `goals.set`, `goals.stop`, `goals.clearOverride`,
`envelopes.patchMeta`, `settings.patch`, and `fxRates.patch`/`fxRates.reset`.
There is no separate batch or raw-patch command format.

Command compilers return one shape, `{ operations, receipt? }`. The receipt
belongs to the caller and is not replay state. Entity builders may use sparse
patches internally; their callers convert those patches into explicit operations
before command preparation.

`prepareCommand` accepts only operations. It validates and normalizes entity
fields, removes unchanged fields, validates Zerro operations, and prepares them
in order so later operations see earlier writes. It then adds `issuedAt` and
an optional action `label`. The label stays on the whole command through
persistence and undo/redo; it never changes execution. Mixed actions combine
entity and Zerro operations in the same list.

Compilers resolve relative actions, including money moves and goal filling, into
absolute assignments before persistence. IDs are fixed before another command
can reference a created object. Replay generates no IDs and reads no ambient
time. Native tag-budget storage is selected when preparing the budget operation,
so changing preferences cannot redirect an outstanding command.

Editing an absent entity is a quiet no-op; editing a soft-deleted transaction is
also ignored. Creation is explicit and requires the entity's creation fields.
Deleting an absent entity is already complete. Labels record the user action
but do not affect execution; unknown labels are discarded without losing work.

The browser enters through
[`executeReduxCommand`](../../runtime/redux/executeCommand.ts), which checks
write restrictions, prepares the command, materializes it, and omits empty
changes before dispatching `appendClientCommand`. Domain builders do not read
Redux.

### Zerro storage materialization

[`materializeZerro.ts`](../../internal/operations/materialization/materializeZerro.ts)
resolves the current logical document by type and month, applies only the named
domain values, and returns entity changes. Existing documents and their unrelated
payload/wrapper fields are preserved. Missing storage is created with reserved
account/reminder IDs; a document received from the server is reused instead.
Clearing an absent value does not create storage.

A budget assignment owns one envelope's monthly amount. A goal assignment owns
the entire goal, avoiding mixtures of one goal's type and another goal's amount.
Stopping stores `null`; clearing removes the monthly override. Metadata, settings
and FX edits own only explicitly set/unset fields. An empty monthly payload can
remove its storage document. `fxRates.reset` explicitly removes the whole month.

Restore is prepared once as concrete entity changes. It does not repeatedly
compare future canonical snapshots to the backup. Its existing planner omits
transaction removals already covered by account-deletion cascades, using the
verified rules for both contained transactions and transfers.

### Confirmation and large uploads

A normal successful request retires its captured command prefix. Failure before
acknowledgement leaves the original commands available for retry. Commands added
after capture remain untouched. A prefix that has become a no-op can be retired
through a cursor-only exchange.

Large uploads retain the existing entity-based chunker. The captured prefix is
materialized to concrete entity operations for sending; after an accepted chunk,
the unconfirmed remainder is persisted in that same command envelope as entity
operations. Sync does not map server rows back to parts of Zerro operations.
This deliberately trades semantic rebase of the large-upload remainder for a
small, existing retry mechanism: pending hidden documents in that remainder are
whole-string writes. Accepted chunks are not rolled back by a later failure.

Old command envelopes are unsupported. Durable loading rejects them and uses the
existing blocked/corrupt-outbox path without silently discarding pending data.
There is no JSON-path compatibility runtime.

Local semantic operations preserve server data already received by the client.
The server still accepts complete JSON strings, so this does not provide atomic
merging with updates that the client has not received yet.

### Materialization

[`materializeCommand.ts`](../../internal/operations/materialization/materializeCommand.ts)
expands intent against the latest snapshot, predicts local server effects, and
returns an applied patch. Replaying repeats this for each command in order.
Local replay uses `issuedAt`; transport replay uses the request's `sentAt`.

Transport uses `materializePrimaryCommand`, which expands only primary intent.
Predicted cascades and balances must never become outgoing client intent.
[Materialization rules](./materialization.md) specify the exact effects and
why some server behavior is deliberately not predicted.

[`applyPatch`](../../internal/domain/zenmoney/model/applyPatch.ts) only applies
explicit changes. It discovers no cascades and interprets no commands.
Canonical responses bypass materialization because the server has already
computed their effects.

## Accepting a server response

A pull dispatches one `applyServerPatch({ ...patch, fullReload? })` action.
The reducer updates `base` and rebases pending commands in the same transition,
so subscribers see the complete replica. There is no staged response in state.

A full reload builds a replacement base from an empty store. A changed root
user drops the previous user's command stacks. During journal recovery, the
replayed Outbox must also pass resulting-state validation before it is used.

[`replicaPersistence.ts`](../../../store/data/replicaPersistence.ts) observes
the action and the states before and after it. The payload supplies
`fullReload`; the previous recovery state determines whether to record a
recovery checkpoint. History listens to the same action to invalidate cached
historical data. The action does not wait for IndexedDB.

Push acknowledgement is separate: Core computes an accepted Chunk, and Redux
receives it through `acceptClientPushChunk`. Persistence records its canonical
state and remaining Outbox before delivery proceeds to the next Chunk.

## Sync and conflicts

A deliberate push captures a fixed Outbox prefix. Later commands remain a
suffix for the next run. Background refresh pulls only, because a push also
consumes the user's undo history.

[`pushRun.ts`](../../internal/operations/replication/pushRun.ts) plans requests
and accepts receipts. [`pushDriver.ts`](../../internal/operations/replication/pushDriver.ts)
owns delivery order, retry classification, backoff, and repacking. The browser
supplies HTTP, byte measurement, persistence, and progress reporting.

Requests are bounded to 2 MiB of the transmitted representation. Multi-Chunk
runs send dependency-ordered upserts, then Cleanup: singleton accounts first,
other removals next, singleton child-first tags last. Account or tag deletion
forces Chunk mode even below the byte limit. The reference graph drives upsert
ordering and sanitation; Cleanup order records observed server cascades.

Each successful response updates the canonical base and retires the exact
items in its receipt. The first acknowledgement replaces the captured prefix
with one remaining command; later acknowledgements shrink it. Applying each
response also lets the next request omit work already done by server cascades.
Every accepted Chunk is persisted before another is sent.

HTTP 413 shrinks and repacks unconfirmed work. Transient failures retry the same
request; deterministic errors stop without skipping items. A response that was
not processed leaves its work pending, so delivery is at least once. A stopped
run starts again from the remaining Outbox; no durable run object is required.
See [ADR 0002](../../../../docs/adr/0002-bounded-push-runs.md).

Conflicts use sparse field overwrite in command order. A successful response
acknowledges its whole Chunk without comparing returned field values. The
consequences are recorded in [Design decisions](./design-ledger.md#accepted-risks).

## Read model and memoization

Pure projectors calculate views from explicit inputs. Their dependencies are
wired once in [`graph.ts`](../../internal/projections/graph.ts):

- `createZerroSession` binds a graph to one immutable snapshot and freezes time
  at construction; reads are lazy and grouped as `session.envelopes.getAll()`;
- the Redux adapter keeps a graph across snapshots, compares input references,
  and reads the clock on each call.

Expensive calculations and allocating inputs to other nodes are memoized.
Primitive reads and existing map references generally are not. Depend on
specific entity maps rather than all of `current`, so unrelated edits leave
expensive results intact. Carry-forward budget calculations still need the
preceding month range.

Presentation decorates domain values afterward: localized names, group labels,
icons, colors, and asset URLs never enter domain calculations. Command-time
reads use the same graph; commands resolve domain identities before compilation.

## Persistence and history

[`replicaStorage.ts`](../../../6-shared/api/replicaStorage.ts) owns IndexedDB:
`replicas` holds the cursor, journal metadata, and Outbox; `journalEntries`
holds checkpoints and compact transitions keyed by root user and sequence.
Their canonical updates share one database transaction.

Startup loads the latest checkpoint and replays its suffix to reconstruct
`base`, then parses and replays the Outbox. A historical point is loaded lazily
from its nearest checkpoint and validated when opened. Redux keeps history
metadata and only the selected historical snapshot.

Full sync, recovery, and retention write checkpoints. Ordinary pulls append
transitions only when canonical data changes; empty pulls update the cursor.
Sequences are never renumbered. Retention folds bounded oldest prefixes under
90 days of server time and 100 MiB of logical JSON bytes. The minimal current
checkpoint and Outbox may exceed the budget. There is no periodic checkpoint
or special retention exemption for restore. See
[ADR 0001](../../../../docs/adr/0001-linear-indexeddb-replica.md).

Browser writes use one Promise queue per tab. A primary persistence failure
disables further primary writes until reload and shows a warning; Redux remains
usable. Compaction failures are secondary and retried later. Logout invalidates
queued saves and awaits the ordered clear. Active tabs are not coordinated.

A corrupt canonical journal preserves a structurally valid Outbox for recovery
through a full reload. If replay over the recovered base is invalid, the Outbox
is quarantined. A corrupt persisted Outbox stays untouched on disk; commands
and sync remain blocked until explicit discard. Recovery never guesses which
unsent commands can be lost.

Viewing history changes the displayed snapshot, not the live replica. Normal
writes are blocked there. Restoring a canonical point or backup compiles an
ordinary live command; restoring a local Outbox point undoes to that position.
The planner and identity rules are described under
[Restore](./design-ledger.md#restore).

## Module boundaries

| Location / entrypoint      | Responsibility                                                |
| -------------------------- | ------------------------------------------------------------- |
| `internal/domain/zenmoney` | Normalized entities, factories, entity facts, reference rules |
| `internal/domain/zerro`    | Hidden data, envelopes, budgets, goals, FX, activity          |
| `internal/operations`      | Materialization, replication, restore                         |
| `internal/projections`     | Shared dependency wiring and memoization                      |
| `zerro-core`               | Snapshot session, constants, shared root types                |
| `zerro-core/redux`         | App-facing `core` domain namespaces: reads, hooks, commands   |
| `zerro-core/replica`       | Explicit integration functions for store and persistence      |
| `zerro-core/headless`      | Non-Redux reads, compilers, and replica operations            |
| `runtime/presentation`     | Presentation helpers and package-safe icon metadata           |
| `support`                  | Test builders, demo fixtures, these documents                 |

Core internals import no React, Redux, HTTP, storage, localization, or app runtime
values. Runtime adapters may depend on the app. Entry files export explicit
capabilities rather than internal barrels; implementation paths are not stable
interfaces. `api-boundary.test.ts` enforces this direction.
