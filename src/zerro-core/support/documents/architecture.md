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
semantic input -> compiler -> intent patch -> issued command -> Outbox
base + Outbox -> materialization with predicted effects -> current
base + captured Outbox -> primary-only replay -> transport
```

### Commands

A durable command records sparse, absolute intent:

```ts
type Command = {
  type: 'patch'
  issuedAt: TMsTime
  patch: TIntentPatch
  label?: TCommandLabel
}
```

`TIntentPatch` admits only `user`, `account`, `merchant`, `tag`, `budget`,
`reminder`, `reminderMarker`, `transaction`, and `deletion`. Reference
collections (`instrument`, `country`, `company`) cannot be command intent.
Entity modules declare writable and required fields beside their factories;
user intent is limited to writable fields on the root user.

A present ID is updated; an absent ID is created. Only fields present in the
intent overwrite the latest entity. Creation must supply the required fields.
This means rebase can recreate an entity removed remotely.

Compilers resolve relative requests such as toggle into absolute values and
capture generated IDs through an explicit context. Issue captures the time.
Replay never generates IDs or reads ambient time. A compiler may return
`{ patch, receipt }`; the receipt is for its caller and is not replay state.
Labels record a verb, optional arguments, and Origin for review. They do not
affect replay, permission, or transport; an invalid stored label is discarded
without rejecting the command.

The browser enters through
[`executeReduxCommand`](../../runtime/redux/executeCommand.ts), which checks
write restrictions, compiles and issues intent, and omits empty changes before
dispatching `appendClientCommand`. Domain compilers do not read Redux.

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
