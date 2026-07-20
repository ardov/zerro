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
- The outbox engine operations are internal. Redux remains the only reactive
  replica owner.
- Do not add package subpaths, an `exports` policy, or a semantic engine facade
  in advance of a consumer.

### Reads and Redux adapter

- Session reads are grouped by domain and use `get*` names.
- A session represents one immutable snapshot and memoizes each node once.
- Redux owns cross-snapshot memoization with granular entity-shaped selectors.
- The projection dependency graph is not maintained as executable graph
  metadata or a hand-kept diagram; the lazy memo wiring in
  `application/session/createZerroSession.ts` is the readable reference.
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
- Display names, duplicate-name labels, tag child lists, formatted/generated
  colors, icons, localization, and asset URLs remain outside domain Core.

### Commands and materialization

The persisted command shape, upsert semantics, materialization pipeline, and
ownership split are specified once in
[architecture.md](./architecture.md#change-pipeline). Decisions not restated
there:

- Writable field lists document the domain capability, not only fields used by
  current production callers. Every non-managed field that may be changed must
  be accepted, persisted, and materialized even before a UI exposes it.

### Replica and sync

The replica model, undo/redo rules, manual-sync commit boundary, primary-only
transport, and conflict policy are specified in
[architecture.md](./architecture.md#replica-model). Decisions not restated
there:

- The loaded app maps platform history shortcuts to undo/redo only outside
  text-editing controls and only when that history direction is available.
- Background sync does not classify commands as rebase-safe versus blocking:
  every admitted command follows the same sparse replay contract.

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
- Put concrete local smells in [notes.md](./notes.md).
- Put implementation history in Git, not this ledger.
