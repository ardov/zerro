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
- The current Redux store and worker use `zerro-core/replica` as an explicit
  integration seam. Its implementation remains internal and it is not a
  package-facing semantic API.
- `domain`, `application`, `infrastructure`, and `presentation` are internal
  implementation paths, not supported app APIs.
- The outbox engine operations are internal. Redux remains the only reactive
  replica owner.
- Do not add npm package subpaths, an `exports` policy, or a semantic engine
  facade in advance of a consumer. Source entrypoints for the current app are
  allowed when they replace deep implementation imports.

### Reads and Redux adapter

- Session reads are grouped by domain and use `get*` names.
- The projection dependency graph is defined once in
  `internal/projections/graph.ts` and
  instantiated by both runtimes. `createZerroSession` binds each node to one
  frozen snapshot; the Redux adapter keeps one instance and memoizes across
  snapshots. Neither runtime re-declares the chain, so the two cannot drift.
  The graph wiring is itself the readable reference — not a hand-kept diagram.
- Memoization is a per-node decision, not a default. Measured on a
  16866-transaction demo store: `buildRawActivity` ~18ms and `buildBalances`
  ~10ms are memoized for cost; cheap-but-allocating nodes are memoized only so
  dependents keep their reference; nodes returning a primitive or passing a
  store map straight through get no memo, because the entry would cost more
  than the call. `inBudgetAccountIds` additionally uses result equality so an
  unrelated account edit does not invalidate the activity chain.
- The graph reads `now()` per call so the long-lived Redux instance follows the
  clock; a session freezes `now` at construction so its snapshot stays on one
  instant. `projectionStability.test.ts` guards the whole-store-dependency and
  result-equality contracts.
- Selector, hook, command, and app-facing types live in their domain modules;
  `runtime/redux/state.ts` owns only the complete-snapshot path, entity modules
  own narrowing selectors, and `commandRead.ts` owns command-time reads.
- Domain functions accept the entity map directly when they need one
  collection, or a small inline object of named maps when they need several.
  One-field `*Source` aliases and identity getters are intentionally absent.
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
- Applied unsynchronized commands form the durable outbox and undo stack. Redo
  is session-only and resets on reload, sync, canonical rebase, and logout.
- Logout resets replica state immediately and awaits an ordered storage clear;
  queued saves from the previous login are invalidated.
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
- Persisted replica V2 has a one-way compatibility reader that preserves its
  applied prefix and discards its redo tail. This is a bounded migration, not a
  general migration framework.

## Active compatibility bridges

### `6-shared/types`

This is the intentional compatibility facade for Core-owned normalized types.
Move consumers gradually; do not perform a big-bang type migration or widen the
Core root to expose implementation barrels.

### Presentation wrappers

- App tag SVG/assets remain outside domain Core while package-safe emoji
  metadata lives in `presentation/tag-icons`.

Keep these bridges until a real consumer or package decision makes their exit
useful.

## Open questions

### Materializer evidence and versioning

- Which real ZenMoney responses become fixtures for transaction balance,
  account deletion, and transfer conversion?
- Future command-shape changes need an explicit compatibility decision; do not
  add a general migration framework without evidence.

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
