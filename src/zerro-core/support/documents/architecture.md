# Zerro Core architecture

## Replica model

Redux owns the live browser replica. Core derives `current` by replaying the root user's Outbox over `base`, the last accepted Zenmoney state. A command is one undo step. Undo and redo move commands between stacks. Appending applies just the new command and clears redo. The journal and Outbox survive reload when persisted. Redo lasts one session. [Replica operations](../../internal/operations/replication/outbox.ts) · [Glossary](../../../../CONTEXT.md)

## Change pipeline

A UI action calls a Redux command. Its compiler resolves relative actions such as “move funds” into ordered operations with concrete IDs and absolute values. Preparation validates fields, removes unchanged writes and fixes the issue time and optional history label. Each operation sees the preceding operations in the same command. Empty changes leave the Outbox and redo untouched. [Command entry](../../runtime/redux/executeCommand.ts)

Creation and patching are explicit. Patching an absent entity or a soft-deleted transaction does nothing. Budget assignments target one envelope and month. Preparing a budget operation fixes whether it uses a native tag budget or hidden Zerro storage. Applying a Zerro operation reads the latest hidden document and changes only its named values. Whole goals are replaced together. Clearing an absent value creates no storage. [Hidden-data materialization](../../internal/operations/materialization/materializeZerro.ts)

### Budget actions

Bulk goal funding tops up children before parents because a parent target includes its children. It skips balance goals without an end date and can leave the unassigned balance negative. Overspending coverage treats children with no own assignment as spending from the parent pool. Restart offsets leftovers in the preceding and selected months, then clears future assignments for existing envelopes. These actions preserve transactions and goals and each creates at most one undo step. [Budget actions](../../internal/operations/budgetActions.ts)

### Materialization

Local replay expands operations with their issue time and predicts balances and cascades. Transport replays primary intent with the request time and sends full writable entities. A locally created transaction already purged by the captured commands has no work to send if absent from the canonical base. [Prediction rules](materialization.md)

## Sync and conflicts

Background refresh pulls canonical data, rebases pending commands and preserves redo. A deliberate push clears redo and captures a fixed Outbox prefix. Later edits wait for the next run. Core plans bounded requests, handles retries and tracks exactly which items each response acknowledges. The host supplies HTTP, byte measurement, persistence and progress. [Push run ADR](../../../../docs/adr/0002-bounded-push-runs.md)

Each accepted Chunk updates the base and retires its receipt before the next request. After partial delivery the unconfirmed prefix becomes one command of concrete entity operations. Hidden documents in that remainder are whole-string writes. The server can silently ignore individual fields on HTTP success, and a lost response can lead to redelivery. [Sync contract](../../internal/domain/zenmoney/sync-api.md)

## Reads

An immutable snapshot session freezes time at creation. The Redux adapter retains a projection graph across updates and compares individual entity-map references. Both consumers share [graph.ts](../../internal/projections/graph.ts). Command-time calculations use the same domain reads. Localized labels, asset URLs and colors are applied afterwards.

Transaction queries combine clauses with AND and selected values within a clause with OR. Amount bounds and currency must match the same leg. A transfer can match either real leg. Debt queries use the ordinary account leg and the same merchant or payee identity as debtor balances. Activity summaries retain counts and amounts. Lists query the transactions when opened.

## Persistence and history

IndexedDB stores a replica manifest with its cursor and Outbox, plus checkpoints and transitions keyed by root user and sequence. A canonical commit updates both stores atomically. Startup replays the newest checkpoint and its suffix, then the Outbox. Full reload validates the server snapshot before replay. Switching root user clears local command stacks. A malformed full response leaves the previous base and pending commands in memory. Failed replay over a valid replacement base enters Outbox recovery. Discard requires an explicit user action for the quarantined on-disk commands. [Redux slice](../../../store/data/slice.ts) · [Persistence adapter](../../../store/data/replicaPersistence.ts)

Ordinary empty pulls advance the cursor. Full reload, recovery and retention create checkpoints. Opening a retained point lazily reconstructs that snapshot. A historical view blocks ordinary writes. Restoring a canonical point creates a live command. Restoring a local Outbox position undoes to it. [Journal ADR](../../../../docs/adr/0001-linear-indexeddb-replica.md) · [Restore rules](design-ledger.md#restore)

## Module boundaries

| Entrypoint            | Consumer                                                                     |
| --------------------- | ---------------------------------------------------------------------------- |
| `zerro-core`          | Immutable snapshot sessions and shared types                                 |
| `zerro-core/redux`    | App-facing domain reads, hooks and commands                                  |
| `zerro-core/replica`  | Store and persistence integration                                            |
| `zerro-core/headless` | Snapshot reads, selected compilers and pure replica operations outside Redux |

Domain and operation modules are independent of browser storage, HTTP, React and Redux. The runtime adapters connect them to the app. [Boundary checks and verification](testing.md)
