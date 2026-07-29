# Zerro Core design ledger

- Updated: 2026-07-29
- Purpose: settled decisions, accepted risks, active bridges, and unresolved
  architectural questions. History stays in Git.

## Settled decisions

### Module and package boundary

- Zerro Core remains an internal source module for the first real headless
  consumer: the repository-local CLI planned in
  [local-tooling.md](./local-tooling.md). Proving that consumer does not require
  publishing or physically moving Core.
- Root `zerro-core` exports only constants, shared root types, and the snapshot
  session.
- The React app uses the explicit namespace-first `zerro-core/redux` adapter.
- The current Redux store and worker use `zerro-core/replica` as an explicit
  integration seam. Its implementation remains internal and it is not a
  package-facing semantic API.
- `zerro-core/headless` is the explicit non-Redux source entrypoint. It exports
  only the narrow read, semantic-command, and replica capabilities required by
  the accepted local tool; it does not export internal barrels.
- `domain`, `application`, `infrastructure`, and `presentation` are internal
  implementation paths, not supported app APIs.
- Redux remains the only reactive app replica owner. The CLI owns one
  non-reactive local `base + outbox` document and must reuse the same pure
  outbox operations.
- Do not add a second semantic engine object. A narrow source entrypoint for the
  accepted CLI is allowed; npm package publication, an `exports` policy, and a
  physical package move remain deferred until another real consumer needs them.
- Canonical patch acceptance, empty-replica creation, and sync cursor overlap
  are pure Core operations reused by Redux. A headless consumer must not
  reimplement those transitions.
- Semantic transaction creation is exposed through both
  `zerro-core/headless` and `core.transactions.create`; both delegate to the
  same Core compiler and command/outbox path.

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
- `materializeCommand` and `materializePrimaryCommand` are allowed to diverge:
  the first adds predicted server effects for local `current`, the second stays
  the transport source. The verified same-account `0.00001` purge is the first
  case where they do, and it must stay that way — sending the predicted
  `deletion` instead of the write would make ZenMoney soft-delete rather than
  purge.

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

### Local tooling MVP

- Implement an agent-first CLI with bounded JSON output before an MCP adapter.
  Shell access is a sufficient first agent interface; machine-readable help and
  explicit side-effect metadata are part of the CLI contract.
- Preview, local stage/undo, and remote sync are separate commands. Reads and
  previews never mutate implicitly, and no command combines stage with sync.
- Preview is not persisted. Stage recompiles semantic input against the latest
  local `current`.
- Outbox mutations require caller-provided request ids. One bounded cache of
  recent receipts makes agent retries idempotent without becoming a proposal
  store, history, or audit database. Refresh remains naturally repeatable and
  does not use the cache.
- The tool supports one profile, one endpoint, one JSON state document, and one
  environment-provided token. The endpoint comes from `ZERRO_ENDPOINT` with
  `ru` as the first-state default. The tool deliberately has no OAuth, keychain,
  multi-profile database, capability system, daemon, or network listener.
- Persist replica/domain truth only as `base + outbox`; derive `current` and
  keep redo session-only. The same document may additionally contain only the
  bounded recent-request cache as tool-local transport metadata.
- The tool owns its state-document parser. Core exposes durable command-array
  validation; the browser-specific persisted-replica migration parser does not
  belong in the headless tool boundary.
- Concurrent writers are outside MVP scope. Atomic file replacement is still
  required to prevent truncated local state, and the local financial document
  uses private directory/file permissions.
- Stable ids are discovered through bounded account, tag, merchant, and
  envelope reads. Automatic title matching is deferred rather than choosing an
  ambiguous entity.
- Envelope hierarchy, monthly budgets, and metrics are required reads.
  Envelope-budget preview/stage is a required write and delegates one bounded
  batch to the existing semantic `compileSetBudget` routing. Envelope creation,
  rename, settings, and structure mutation remain outside MVP.
- Budget writes accept only a strict JSON batch of explicit `set` or `clear`
  operations. Preview materializes that batch only in memory; stage and undo
  persist exactly one outbox transition plus a bounded flat retry receipt.
  The tool never exposes a raw patch, hidden reminder payload, or durable redo
  tail.
- Transaction creation remains semantic and accepts a narrower agent JSON DTO
  than Core's internal date draft. Transaction update and delete are deferred.
- Transaction preview and stage share the Core compiler and materializer. The
  CLI validates only its strict external JSON contract and resolves references
  for bounded errors; it neither rebuilds factory defaults nor predicts account
  balances. A staged receipt retains the generated id solely for idempotent
  local retry.
- The CLI accepts the same whole-prefix acknowledgement and silent-drop risk as
  the app. Generalized satisfaction checks, quarantine, and retry are deferred.
  Transport failures that may have reached ZenMoney are reported as an unknown,
  non-retryable outcome rather than inviting a blind retry.
- Sync is explicit and uses the Core primary-only transport plus canonical
  prefix acknowledgement. Empty outboxes never require a token or open the
  network path; an explicit 4xx refusal is a definitive local no-op, while
  transport, server, or malformed-success uncertainty preserves the outbox and
  is never represented as retry-safe.
- MCP, if added after the CLI, delegates to the same application functions and
  maps one-to-one to the CLI operations; it contains no business, persistence,
  query, or sync logic.

## Accepted product risks

- Transaction edits may leave `account.balance` stale until synchronization;
  balance effects belong to materialization.
- Upsert may recreate an entity that disappeared remotely while a local patch
  remained pending.
- A successful response is trusted as whole-batch acknowledgement. A server
  that silently rejects part of a request can therefore cause local intent to
  be dropped. Probing confirmed that the mechanism exists (an older or equal
  `changed` is ignored under HTTP 200, and some invalid field values are dropped
  while the write applies); the product accepts that risk to keep one stable
  whole-prefix acknowledgement rule.
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

- Does a second external consumer justify publishing or physically moving the
  Core package after the local CLI proves the source boundary?
- Which presentation assets need a supported package boundary?
- Which package subpaths should exist if Core becomes publishable?

## Update rules

- Move an answer into settled decisions only when it is implemented or
  explicitly accepted.
- Remove a bridge with its last consumer.
- Put concrete local smells in [notes.md](./notes.md).
- Put implementation history in Git, not this ledger.
