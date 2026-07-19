# Zerro Core design ledger

- Updated: 2026-07-20
- Purpose: settled decisions, accepted risks, active bridges, and unresolved
  architectural questions. History stays in Git.

## Settled decisions

### Module and package boundary

- Zerro Core is an internal app module until a real external/headless consumer
  exists.
- Root `zerro-core` exports only constants, shared root types, and the snapshot
  session.
- The React app uses the explicit namespace-first `zerro-core/redux` adapter.
- `domain`, `application`, `infrastructure`, and `presentation` are internal
  implementation paths, not supported app APIs.
- The reference engine and outbox primitives are internal. Redux remains the
  only reactive replica owner.
- Do not add package subpaths, an `exports` policy, or a semantic engine facade
  in advance of a consumer.

### Reads and Redux adapter

- Session reads are grouped by domain and use `get*` names.
- A session represents one immutable snapshot and memoizes each node once.
- Redux owns cross-snapshot memoization with granular entity-shaped selectors.
- The projection dependency map is maintained as Mermaid documentation in
  `architecture.md`, not as executable graph metadata.
- Selector, hook, command, and app-facing types live in their domain modules;
  `redux/state.ts` owns raw inputs and `commandRead.ts` owns command-time reads.
- Domain namespaces are the desired adapter shape. Add and retain members only
  for real consumers.
- Activity and budget projections retain aggregate amounts and transaction
  counts, never transaction arrays. Transaction lists filter the canonical
  history on demand.
- Transaction filters are typed query clauses. Intrinsic clauses compile from
  transaction fields; activity/envelope clauses use the same pure routing
  projector as activity calculation, with context prepared at the adapter
  boundary.
- Query clauses compose with AND; multiple values inside one clause compose
  with OR. Compile sets and envelope scope once, outside the transaction loop.
- Localization, generated colors, icons, and asset URLs remain outside domain
  Core.

### Commands and materialization

- The outbox stores `TCommand[]` directly. Every command has the same `patch`
  shape: `type: 'patch'`, `issuedAt`, and a sparse entity intent patch. There is
  no separate outbox-entry wrapper, entry id, or persisted materialized patch.
- Entity patch types live beside entity types and use
  `EntityPatch<TEntity, TWritableFields>`. `id` is required and every field that
  may appear in sparse intent is explicitly listed.
- Writable field lists document the domain capability, not only fields used by
  current production callers. Every non-managed field that may be changed must
  be accepted, persisted, and materialized even before a UI exposes it.
- Entity patches use upsert semantics: an existing id is patched and a missing
  id is created. Commands capture generated ids and every other nondeterministic
  input before persistence.
- Deletion intent stores entity identity; materialization supplies transport
  metadata such as timestamps and ownership.
- Commands set absolute values and remain idempotent. Relative operations such
  as toggle or increment are resolved to absolute intent before issue.
- Semantic Redux verbs may compile differently, but they all issue the same
  persisted command type. Receipts are caller-only and are not replay state.
- Local materialization first expands sparse primary intent to full entities,
  then derives predicted server side effects. Transport materialization expands
  primary intent only and must not echo predicted effects back to ZenMoney.
- `applyPatch` applies only explicit changes and owns no cross-entity rules.
- Canonical server diffs bypass local materialization.
- Replay rematerializes the command prefix against `base` in order.

### Replica and sync

- The durable logical replica is `base`, `outbox`, and `outboxHead`; `current`
  and request transport are derived.
- Undo/redo move `outboxHead`; append after undo drops the redo tail.
- The loaded app maps platform history shortcuts to undo/redo only outside
  text-editing controls and only when that history direction is available.
- Persistence stores versioned replay inputs plus the base server timestamp,
  not derived state.
- Manual sync drops the redo tail, captures the sent prefix length,
  builds primary-only transport with fresh entity versions, and applies the
  response as canonical. Any successful response acknowledges the whole sent
  prefix; Core removes exactly `sentOutboxCount` commands without inspecting
  final field values. Undo/redo remains disabled until the request finishes.
- Commands appended while a request is active remain after the acknowledged
  prefix and replay over the new canonical base.
- First-stage conflict policy is field-level last write wins within command
  order. Several commands may touch the same field; the last one determines the
  final value without making earlier commands unacknowledged.

### Testing

- Focused domain/contract tests protect behavior; Redux invalidation tests
  protect memoization edges.
- Deterministic demo data protects representative public graph behavior.
- Legacy parity tests are temporary bridges and leave with their implementation.
- Trivial map access and self-consistency tests are not valuable by default.
- Package declaration compilation is a separate boundary gate.
- The default parallel suite must pass; serial-only green is diagnostic, not a
  completion result.

## Accepted product risks

- Transaction edits may leave `account.balance` stale until synchronization;
  balance effects belong to materialization.
- Upsert may recreate an entity that disappeared remotely while a local patch
  remained pending.
- A successful response is trusted as whole-batch acknowledgement. A server
  that silently rejects part of a request can therefore cause local intent to
  be dropped; revisit only with evidence that this occurs.
- Undo/redo is keyboard-accessible in the loaded application; visible controls
  remain deferred.
- Replica metadata is disposable until product continuity requirements justify
  migrations.

## Active compatibility bridges

### `6-shared/types`

This is the intentional compatibility facade for Core-owned normalized types.
Move consumers gradually; do not perform a big-bang type migration or widen the
Core root to expose implementation barrels.

### Demo and presentation wrappers

- `src/demoData` remains a thin wrapper over `zerro-core/demo`.
- App tag SVG/assets remain outside domain Core while package-safe emoji
  metadata lives in `presentation/tag-icons`.

Keep these bridges until a real consumer or package decision makes their exit
useful.

## Open questions

### Materializer effects and primary transport

Before adding balance or cascade effects, implement primary-only transport
replay separately from UI `current`. The encoder may collect touched entity ids
and read their final full values from a primary-only working snapshot; it must
not read full entities from `current`, which also contains predicted effects.

### Materializer evidence and versioning

- Which real ZenMoney responses become fixtures for transaction balance,
  account deletion, and transfer conversion?
- Pending replica metadata currently has no compatibility or migration
  requirement. Revisit versioning only when real persisted users exist.

### Product rules

- How should renaming a visible payee envelope affect several raw payee
  spellings?
- Which dirty sessions should opt into automatic sync after the unified
  primary-only transport path lands?

### Future surfaces — not scheduled

- Which consumer would justify a semantic engine facade?
- Which presentation assets need a supported package boundary?
- Which package subpaths should exist if Core becomes publishable?

## Update rules

- Move an answer into settled decisions only when it is implemented or
  explicitly accepted.
- Remove a bridge with its last consumer.
- Put concrete local smells in [cleanup-notes.md](./cleanup-notes.md).
- Put implementation history in Git, not this ledger.
