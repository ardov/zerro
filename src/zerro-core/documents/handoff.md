# Zerro Core handoff

- Updated: 2026-07-20
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
- The outbox stores direct `TCommand[]` values. Every command has exactly
  `type: 'patch'`, `issuedAt`, and `TIntentPatch`; there is no entry wrapper or
  durable command union.
- Persistence version 2 validates the command-only shape and does not store
  derived state; no old command format needs migration.
- The snapshot session remains frozen and exposes only namespaced reads.
- Activity and budget projections retain counts instead of transaction arrays;
  typed transaction queries reconstruct intrinsic and envelope-filtered lists
  from canonical history on demand.
- Materialization overlays sparse fields on existing entities and uses domain
  factories to create missing account, reminder, merchant, and tag ids without
  ambient time or id generation. Other entity creation and cross-entity effects
  remain deferred.
- Successful sync removes exactly the captured sent prefix; per-command
  satisfaction checks are removed. Commands appended in flight remain pending.
- Issue reduces existing account, reminder, merchant, and tag results to changed
  writable fields and creation results to required fields plus non-default
  values. Budget now follows the same rule and validates its derived `date#tag`
  id. Incomplete creation intent fails before append. Deletion commands persist
  only `{ id, object }`; materialization supplies `stamp` and `user`.
- Hidden-data commands need no dedicated intent type: their account, reminder,
  and deletion output is reduced by the existing entity paths.
- Transaction lifecycle intent includes `deleted`; UI-editable transaction
  fields remain a narrower input type. Some domain transaction compilers still
  emit complete results and are the last sparse-intent cleanup.
- Writable patch contracts now live beside their entity contracts. Account,
  tag, merchant, reminder, transaction, envelope-meta, and user-settings
  command modules consume those colocated types. Account intent explicitly
  covers creation fields while excluding managed `changed`, `user`, and
  derived `balance`.

## Next checkpoint: sparse compilers and upsert

Land this as small independent commits where practical:

1. reduce remaining full-result transaction compilers to sparse lifecycle/edit
   intent and make creation requirements explicit;
2. split primary-only transport from local materialized effects;
3. run reload, undo/redo, repeated-field, in-flight append, and explicit-sync
   smoke.

Until the first command-schema rollout, persisted outbox compatibility is not a
product requirement and incompatible local metadata may be discarded. After
that rollout, persisted commands become a durable compatibility contract.

See the ordered slices in [roadmap.md](./roadmap.md). Add balance and cascade
rules only after primary-only transport is established.

## Boundaries to preserve

- Root `zerro-core` stays facade-only; the app uses `zerro-core/redux`.
- Domain/application code must not import Redux, React, IndexedDB,
  localization, worker code, or app runtime modules.
- Commands express sparse writable intent. Entity patch types live beside
  entity types and use `EntityPatch<TEntity, TWritableFields>` so their writable
  fields remain explicit.
- Missing ids use the accepted upsert behavior and create entities; issue must
  capture ids, time, and every nondeterministic input.
- `applyPatch` remains dumb; cross-entity behavior belongs in materialization.
- Canonical server diffs bypass local materialization.
- Transport uses primary-only replay and never reads predicted effects from UI
  `current`.
- Redux remains the only reactive replica owner.
- Persist commands, not materialized patches, `current`, sync transport, or
  response staging.

## Accepted product risks

- Account balances may be stale until explicit synchronization.
- A pending patch may recreate an entity deleted remotely.
- Successful sync drops the whole sent prefix; silently rejected partial writes
  are not detected without new evidence that detection is needed.
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
