# Zerro Core design ledger

- Updated: 2026-07-31
- Purpose: settled decisions, accepted risks, active bridges, and unresolved
  architectural questions. History stays in Git. Questions that need the
  maintainer rather than an implementer are listed for review in
  [open-decisions.md](../../../../docs/open-decisions.md); an answer becomes a
  settled decision here.

## Settled decisions

### Module and package boundary

- Zerro Core remains an internal source module. Its first real headless
  consumer, the repository-local CLI in
  [local-tooling.md](./local-tooling.md), shipped without publishing or
  physically moving Core, which is the evidence that the source boundary holds.
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
- Predicted balances involve no currency conversion, and no future change to the
  rule may introduce one. Each side of a transaction is already denominated in
  its own account's currency, so a cross-currency transfer expresses its rate as
  the pair of stored numbers rather than as something to apply; a foreign
  original amount lives in `opIncome`/`opOutcome`, which the rule excludes.

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
- Pushing the outbox is always a deliberate user action. Automatic sync is
  pull-only, because a push clears the acknowledged prefix and therefore
  destroys the undo history the user still expects to have. Decided 2026-07-30,
  implemented 2026-07-31: `syncData` pushes and only the refresh control calls
  it, while `refreshData` pulls and is what background sync and post-login use.
- `redo` survives a pull and is cleared only by an acknowledgement. Implemented
  2026-07-31 in `acceptCanonicalPatch`, which now clears the tail only when a
  sent prefix was actually acknowledged. Manual sync is unchanged: it still
  clears `redo` up front through `prepareClientSync`, so the commit boundary
  stays where it was recorded. Without this, pull-only sync would have fixed
  undo while still discarding redo every couple of idle minutes.
- The app tells the user when unsynchronized intent exists: a leave
  confirmation before unload, and a visible notice after load when the restored
  outbox is not empty. A silent pending outbox is not acceptable, because
  nothing else distinguishes "saved locally" from "saved in ZenMoney".

### Change history and restore

Decided 2026-07-31. The app keeps a user-visible change history and can restore
any retained point. The implementation path is
[notes.md](./notes.md#4-change-history-and-restore).

- The journal is not the outbox. The outbox is "what must still be sent" and is
  truncated on acknowledgement; the journal is "what happened", is append-only,
  is never replayed into `current`, and is pruned by age. Merging the two would
  resend acknowledged commands.
- Canonical diffs are already the event log. Retaining them plus one compacted
  genesis snapshot reconstructs any retained point by forward replay. Reverse
  application is impossible — a diff carries no before-values.
- The log is additive and off the hot path. `base + outbox` remain the only
  durable replica inputs and the only thing `current` derives from.
- Restoring a point and importing a backup are one operation:
  `diffStores(current, desired, scope) -> TIntentPatch`. It produces an ordinary
  command, so restore inherits materialization, transport, undo-before-push, and
  its own journal entry. There is no second write path into the store.
- Restore never truncates the timeline. It appends one more entry like any other
  change. Dropping later points would destroy both the record of what was
  overwritten and the ability to restore back.
- Scoped restore (one account, envelope, or month) is the primary form. Global
  restore is an escape hatch behind its own confirmation, because a rewind is
  only safe where the user knows what it overwrites.
- Semantic labels are captured at issue time and stored in the journal, never in
  `Command`. They are structured `{ verb, args }` rather than rendered strings,
  so language and renamed entities resolve at display time. A label is inert: no
  materialization or transport path may read one.

Restore is not undo, and three consequences must be visible in the UI rather
than only recorded here:

- it overwrites concurrent changes from other devices inside its scope — the
  motivating "my phone changed something" case is exactly when other real edits
  also exist, which is why scope is the primary control;
- it is lossy for deletions. `deleted: true` is a server-side ratchet and a
  purged id is a permanent tombstone, so a removed transaction can only come
  back under a new id, losing its identity and references;
- a large restore is one big push against the accepted whole-prefix
  acknowledgement risk, so a partial silent rejection can land a state that is
  neither the chosen point nor the current one. The point immediately before a
  restore is therefore exempt from pruning, so a restore is always reversible by
  another restore.

### Product rules

- Renaming a payee envelope promotes it to a merchant. If a matching merchant
  exists, it is renamed and every transaction that carried only the raw payee
  string is attached to it; otherwise the merchant is created first. The
  several raw spellings behind one visible payee therefore collapse under one
  merchant instead of being rewritten one by one. Decided 2026-07-30.
- The promotion is one command, so undo reverses the rename, the creation, and
  every attachment together. It also changes the envelope id from `payee#…` to
  `merchant#…`, so it must carry the envelope's metadata — budget, goal,
  parent, group, visibility — to the new id rather than orphaning it.

### Testing

- Focused domain/contract tests protect behavior; Redux invalidation tests
  protect memoization edges.
- Deterministic demo data protects representative public graph behavior.
- Legacy parity tests are temporary bridges and leave with their implementation.
- Trivial map access and self-consistency tests are not valuable by default.
- Package declaration compilation is a separate boundary gate.
- The default parallel suite must pass; serial-only green is diagnostic, not a
  completion result.

### Local tooling

- The agent interface is one CLI with bounded JSON output. Shell access plus
  machine-readable help and explicit side-effect metadata proved sufficient for
  a maintainer working in a repository checkout, so no MCP adapter ships with
  the CLI.
- An MCP adapter is still open, but as part of a different product question:
  a desktop host that embeds Zerro and owns the ZenMoney token, so a user never
  pastes one into a terminal. Distribution, not agent ergonomics, is what would
  justify it. See
  [open-decisions.md](../../../../docs/open-decisions.md#1-mcp-inside-a-desktop-host).
  If it ships, it delegates to the same application functions as the CLI, maps
  one-to-one onto its commands, and contains no business, persistence, query,
  or sync logic of its own.
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
- Read options are shared vocabulary: paging, `--fields`, `--format`,
  `--display-currency`, and `--query` keep one name and meaning across every
  read that offers them. Entity options resolve a stable id or an exact
  case-insensitive title and never choose among substring matches.

## Accepted product risks

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

These are the architectural questions themselves. The ones that need the
maintainer's answer before any implementation are restated with their options
and consequences in [open-decisions.md](../../../../docs/open-decisions.md).

### Materializer evidence and versioning

- Which real ZenMoney responses become fixtures for the account-deletion and
  transfer-survivor cascades, when those rules become reachable? The balance
  rule needed none: probing had already established the formula, and the rule
  performs no currency conversion, so there was no unverified assumption left to
  confirm.
- Future command-shape changes need an explicit compatibility decision; do not
  add a general migration framework without evidence.

### Change log retention

- How large is a genesis snapshot plus a realistic run of incremental diffs on a
  real account, and what retention window does that buy? This is a measurement
  before it is a decision, and it gates building the log. Restated in
  [open-decisions.md](../../../../docs/open-decisions.md#6-retention-budget-for-the-change-log).
- Does correlating a journal entry with its command need an explicit `Command`
  id, or does `issuedAt` suffice? An id reverses the recorded "no entry id"
  decision and bumps the persisted replica version; `issuedAt` is a
  near-unique key with no shape change. Decide against the journal's real undo
  and acknowledgement cases, not in the abstract.

### Future surfaces — not scheduled

- Does a second external consumer justify publishing or physically moving the
  Core package after the local CLI proves the source boundary?
- Which presentation assets need a supported package boundary?
- Which package subpaths should exist if Core becomes publishable?

## Update rules

- Move an answer into settled decisions only when it is implemented or
  explicitly accepted.
- Remove a bridge with its last consumer.
- Remove an item from
  [open-decisions.md](../../../../docs/open-decisions.md) in the same commit
  that records its answer here.
- Put concrete local smells in [notes.md](./notes.md).
- Put implementation history in Git, not this ledger.
