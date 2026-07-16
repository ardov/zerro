# Zerro Core handoff

- Updated: 2026-07-16
- Branch: `core-next`
- Module: `src/zerro-core`
- Worktree: verify before editing

This file routes the next task. Git contains implementation history.

## Current state

- Legacy model objects, generic local patch writes, and the duplicate derived
  read graph are removed from production paths.
- App consumers use domain namespaces from `zerro-core/redux`; the adapter is
  the supported application surface.
- Redux owns `base + outbox + outboxHead`. `current`, pending counts, and sync
  transport rematerialize from the command prefix.
- Local entries are flat durable commands with only `createdAt` added.
  `transactions.patch` is the first narrow durable command;
  `transaction.recreate` handles immutable `created`; unmigrated command
  families resolve to transitional `patch`.
- Persistence validates current replay inputs and does not store derived state;
  no old command format needs migration.
- The snapshot session remains frozen and exposes only namespaced reads.
- Activity and budget projections retain counts instead of transaction arrays;
  typed transaction queries reconstruct intrinsic and envelope-filtered lists
  from canonical history on demand.
- Materialization recompiles durable commands, preserves remote transaction
  fields during sparse rebase, skips deleted transactions, and assigns strict
  fresh entity versions. Cross-entity effects remain deferred.

## Next checkpoint: health and closure

Land this as small independent commits where practical:

1. **Manual completion smoke**
   - edit a budget or goal;
   - edit a transaction and reload with a pending outbox;
   - perform explicit sync and verify canonical rebase.

## After closure: materializer checkpoint

Before transaction-balance effects or account-deletion cascades:

1. migrate the command family to a narrow durable shape;
2. define its satisfaction and terminal no-op rules;
3. encode only primary entities for transport;
4. implement one deterministic materializer rule per verified commit.

Deleted-transaction immutability is the smallest first rule. Balance effects,
account deletion, and transfer conversion follow only after the transport
decision.

## Boundaries to preserve

- Root `zerro-core` stays facade-only; the app uses `zerro-core/redux`.
- Domain/application code must not import Redux, React, IndexedDB,
  localization, worker code, or app runtime modules.
- Commands express writable intent through explicit field whitelists; avoid
  `Partial<TEntity>` APIs.
- `applyPatch` remains dumb; cross-entity behavior belongs in materialization.
- Canonical server diffs bypass local materialization.
- Redux remains the only reactive replica owner.
- Persist commands, not materialized patches, `current`, sync transport, or
  response staging.

## Accepted product risks

- Account balances may be stale until explicit synchronization.
- Automatic sync continues with only sparse transaction patches pending. A
  transitional `patch` still pauses it until explicit sync.
- Undo/redo is available through platform keyboard shortcuts outside text-editing
  controls.
- Replica metadata is disposable until continuity requirements justify
  migrations.

## Completion gate

Do not call the refactor complete until:

1. focused tests, TypeScript, default parallel Vitest, package consumer,
   formatting, and dependency boundaries are green;
2. the manual budget/goal, transaction reload, and explicit-sync smoke passes;
3. production uses no legacy model API that the Redux adapter replaces;
4. remaining compatibility code has an owner and an exit condition.

See [testing.md](./testing.md) for the verification matrix and
[roadmap.md](./roadmap.md) for ordering.
