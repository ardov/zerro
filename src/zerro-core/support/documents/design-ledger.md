# Zerro Core design ledger

- Updated: 2026-08-06
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
  the transport source. The purge of a transaction whose amounts are both stored
  as zero is the first case where they do, and it must stay that way — sending
  the predicted `deletion` instead of the write would make ZenMoney soft-delete
  rather than purge.
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

Revised 2026-08-06. The app keeps a user-visible change history and can restore
any retained valid point. The implementation path is
[notes.md](./notes.md#4-change-history-and-restore).

- The journal is not the outbox. The outbox is "what must still be sent" and is
  truncated on acknowledgement; it is the temporary undo/redo tail after the
  last server point. The journal is the durable source of accepted server state.
  It has an active checkpoint plus compact canonical transitions; reconstructing
  that branch yields `base`, then `base + outbox` yields `current`.
- A journal transition is a compact normalized state delta, not a raw ZenMoney
  response and not a restore intent. It stores only changed fields, deletions,
  and the new cursor, and must satisfy
  `applyPatch(before, transition) === after`. An empty pull creates no point;
  one successful push produces one canonical point, including accepted local
  and remote changes.
- Compaction happens only at canonical-sync points. It replaces the discarded
  prefix with a newer checkpoint, so every retained point remains forward
  replayable. The initial retention policy is a three-month maximum age, a
  50 MiB soft threshold for compaction/compression, and a 100 MiB hard journal
  budget. The runtime now compacts aged prefixes and removes the oldest sealed
  branches when the hard budget requires it; the soft threshold reports that a
  compression codec is needed but does not yet change the storage encoding.
  These are tunable defaults; measurement can adjust them later.
- A full reload starts a new active branch from a complete server checkpoint and
  seals the former branch. Sealed branches remain read-only historical and
  validated restore candidates, never inputs to live `current`.
- Active-branch validation is lazy: validate only its final reconstructed state
  at app load, not every response. The shipped domain validator checks the
  root/debt cardinalities, references, and tag-parent cycles; a failure leaves
  the branch intact, raises the session-only `journalRecoveryRequired` flag,
  and blocks journal persistence until full reload; the global recovery notice
  offers that action with confirmation. Validate a historical point only when
  it is opened or used for restore. A point caches `unknown`, `valid`,
  or `invalid` with the validator version; a result from an older validator
  version is `unknown` until checked again. Invalid points stay visible with a
  reason but cannot restore.
- Restoring a journal point (server state) and importing a backup are one
  operation: an internal
  `buildRestorePlan(current, desired, { scope, allocateId }) -> TRestorePlan`
  produces the ordinary command's intent patch. Restore therefore inherits materialization,
  transport, and undo-before-push; its accepted canonical response becomes a
  journal point, so there is no second
  write path into the store. Preview receives deterministic temporary IDs and
  apply receives real UUIDs only at dispatch. Implemented 2026-08-01 in
  `internal/operations/restore/diffStores.ts`, with backup import as its first
  consumer.
- Restoring a local (unsent) point is a plain undo to that position in the
  outbox, not a diff-and-append. Revised 2026-08-03: diffing it against live
  state like a journal point would ask `buildRestorePlan` to emit a `deletion`
  for an entity the server has never seen — created and undone entirely inside
  the local outbox — which the transport must never send. Undo has no such
  problem, since it only removes commands that were never sent, and it stays
  reversible through redo until the next reload.
- The history list is a read-only projection over journal replay, and it is one
  ordered surface rather than three: redo tail, applied local commands, then
  journal points and sealed branches. Selecting any row below the redo tail
  changes Core read selectors but never the live `base + outbox` replica.
  Ordinary commands and patches are blocked while a past point is selected;
  restore is the only write action. The sync button is the sole entry point: a normal
  click still pushes, a right-click or long-press opens a preview of the same
  list's live end (redo tail, applied commands, `Send`), and an action there
  expands into a non-modal panel — a right drawer on desktop, a full-screen
  sheet on mobile — showing the whole list. There is no separate `/history`
  route or nav entry.
- The list is not chronological, because `current = base + outbox`: a
  background pull inserts a journal point under unsent local commands even
  though it arrived later. A divider marks the boundary between the local
  stack and the journal; it is not read as time.
- The newest selectable row is the live replica under another name, not a point
  in the past. Added 2026-08-06: selecting it is normalized to no selection at
  all, so data stays live and writes stay unblocked. The normalization is a read
  selector rather than a guard at the dispatch site, because the list moves under
  a selection — an undo can shorten the outbox until the selected position _is_
  the head — and the app has to become editable again without waiting for the
  user to notice. The list still marks that row as "you are here" while the
  status bar is open.
- The status bar is a browsing mode rather than a rendering of the selection.
  Revised 2026-08-06: it opens when a row is selected and closes only on its own
  exit control or Escape, so stepping forward onto the head — which is no
  selection at all — leaves it in place. Tying its visibility to "a point is
  selected" would have made the forward arrow unmount the bar as a side effect of
  its own press. It sits at the top of the viewport rather than the bottom, so it
  pushes content down instead of overlaying the mobile bottom navigation, and it
  keeps every control mounted and switches `disabled` instead of appearing and
  disappearing: step back/forward across the visible rows (a collapsed run of
  points is one step), reopen-panel, restore, go-to-current, and exit. A bar that
  changed its height or its set of controls mid-step would shift the page the
  user is reading. For the same reason no control changes meaning between states:
  go-to-current jumps to the head and never exits, exit never jumps. Restore is
  the one action that ends the session, because it writes and its result is the
  live state.
- A collapsed run is a position as well as a row: it stands in for its newest
  point, which is what makes it one step rather than none. Expanded, it stays as
  the header its own points hang under, so the expansion can be undone, and it
  stops being a position, because each of its points is now a row of its own.
- Issuing a command clears the selection. Added 2026-08-06: a command can only
  be issued while the selection is not showing the past, so an append means the
  user was effectively live and the stored point is stale by definition. Without
  this the selection stays pinned to an outbox index that stops being the head
  the moment the outbox grows, and the app silently rewinds to before the change
  the user just made — the same "looks live but is not" failure the head rule
  exists to prevent, arriving one command later.
- The panel gives back the width it takes. Added 2026-08-06: a persistent MUI
  drawer draws over the page unless the layout is told otherwise, and a panel
  that covers the app it claims to sit beside is a modal with extra steps. For
  the same reason the status bar lives inside the content column rather than
  above the whole layout: the navigation drawer is fixed, and a full-width bar
  hands it every control on its left.
- A journal point stores one boolean, `pushed`: true for a point produced by
  the user's own push, false or absent for one produced by a pull. This is the
  only per-point distinction the journal retains about its cause; it exists so
  the list can collapse a run of consecutive pull points into one collapsible
  row while keeping every point the user deliberately pushed visible on its
  own. It is not a step toward a fuller per-point audit trail — see the label
  bullet below for why that is deliberately not retained.
- Checkpoints validate and restore like any other point. `listJournalHistory`
  does not hard-code an `unknown` status for a checkpoint, and validation does
  not skip `pointId === null`; skipping it left the first point of every
  branch permanently unrestorable, silently contradicting every other bullet
  in this section. Validation stays lazy, so an unopened point shows no status
  icon rather than a false "clean" one; a background sweep that validates a
  whole branch on load is deferred until the icon is needed at rest.
- Selecting a point does not pin it against retention. If a background pull
  compacts the selected point into its branch checkpoint while it is open, the
  panel and status bar must say so rather than silently falling back to live
  data while still claiming to show the past.
- A restore removes a row only where the domain already has a removal, and the
  diff carries one row per entity type saying which: soft delete for
  transactions, zeroing for budgets, a real `deletion` for reminders, and
  nothing for accounts, tags, and merchants. Emitting a deletion for the last
  three would leave transactions referencing a row that no longer exists
  locally, because the server cascades of materialization.md rules 4-7 are not
  predicted; they become expressible together, when the deletion commands ship.
- Restore never reuses an absent backup ID. A live same-ID entity is updated in
  place; otherwise an exact semantic match is reused once, and an unmatched
  creatable entity receives a fresh ID with every dependent reference remapped.
  Desired deleted transactions remain absent and current deleted transactions
  never become live under their old ID. If no semantic replacement exists, a
  desired live transaction receives a fresh ID. Repeating the restore therefore
  converges instead of producing a second command.
- `apply` recomputes the diff at dispatch time and never issues a patch built
  for the preview. A background pull can land between the two, and a restore is
  defined against the store it is applied to, not the one the user was shown.
  The preview is therefore a count, not a promise.
- Restore never truncates the timeline. Its accepted canonical response appends
  a later server point; dropping later points would destroy both the record of
  what was overwritten and the ability to restore back.
- Scoped restore (one account, envelope, or month) is the primary form. Global
  restore is an escape hatch behind its own confirmation, because a rewind is
  only safe where the user knows what it overwrites.
- Semantic labels are captured at issue time as an inert optional field on
  `Command` — `label?: { verb, args }` — not stored in the journal. Revised
  2026-08-03: a journal point is produced by squashing however many outbox
  commands a push acknowledges into one canonical transition, so a label has
  to survive on the command through issue, undo/redo, and push, and the
  command is the only place that holds true across all of those; it does not
  survive the squash into a point. History older than the last push therefore
  carries no label, only the point's own diff (below). `args` carries both the
  referenced id and a name snapshot taken at issue time, so a later rename
  still resolves through the id while a deletion renders under the name that
  existed when it was made, instead of a dangling lookup. Verbs are a closed
  union in Core; rendering and pluralization resolve in the app against that
  union, so a missing translation is a compile-time gap, not a blank label at
  runtime. A label stays inert: `materializeCommand` and `buildOutboxTransport`
  do not read it, and `parseCommandOutbox` drops a corrupt or unrecognized
  label without failing the command it is attached to — a bad label must never
  be the reason a durable outbox fails to load. Implemented 2026-08-06 in
  `internal/operations/materialization/commandLabel.ts`, with one half of
  `args` still dormant: the name snapshot is captured where the name is the
  caller's own argument, and display-time resolution through the id is not
  built, so a label renders the snapshot or nothing. Every row must survive a
  missing label regardless — commands issued before this existed have none.
- A point's own diff — `compactCanonicalTransition` against the previous point
  — is what the list row shows. It is already what `transition` stores, so it
  needs no replay and, unlike a diff against live state, never changes once
  written. The diff against live state, which is what a restore would
  overwrite, is computed only on demand in the panel. Applied local commands
  show their label when present and fall back to their own materialized diff
  otherwise; a checkpoint has no diff of its own, since it is a full state
  rather than a change.
- Zerro's own state — goals, envelope budgets, envelope metadata, FX rates,
  and the other `HiddenDataType` payloads — lives as JSON in one `reminder`'s
  `comment` per month, so a changed goal reaches the diff as "1 reminder
  changed" unless it is decomposed. Decomposition happens at two levels, split
  2026-08-06 by what each level costs. The **type** is readable from the
  changed comment alone, so a list row reports `goal`, `envelope-budget`,
  `envelope-meta`, `fx-rates`, `tag-order`, `user-settings`,
  `linked-accounts` or `linked-debtors` in place of `reminder`, counting the
  monthly records that changed. The **key** — which entries inside the payload
  moved — needs the payload as it was before, which needs a replay, so it
  belongs to the panel's restore preview, where the point is replayed anyway;
  there `summarizeStoreDiff` compares both comments and counts payload entries,
  including the entries a deleted hidden-data reminder takes with it. Naming
  those entries and grouping them under the envelope they belong to is a
  further step and is not built: it needs envelope titles, which are an app
  projection rather than store data. Splitting the two levels keeps the row's
  "no replay" rule intact instead of quietly buying detail with a per-row
  replay. This is a presentation pass over the existing
  ZenMoney-entity diff, not a second diff over derived Zerro state: derived
  state includes computed balances and activity, which would make every
  transaction look like it changed a dozen envelopes. `tag`, `account`, and
  `merchant` rows keep their own entity type and only join an envelope's
  group; they are never relabeled as `envelope`. A payload that fails to parse
  falls back to the raw entity row instead of throwing. The diff view is
  read-only in this pass — no per-row restore, only the point-level one below.

Restore is not undo, and three consequences must be visible in the UI rather
than only recorded here. The backup-import confirmation states all three and
shows the per-entity counts the restore would write:

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

- How do real-account transition sizes compare with the initial retention
  defaults? This is a follow-up measurement, not an implementation gate. It is
  restated in
  [open-decisions.md](../../../../docs/open-decisions.md#5-retention-budget-for-the-change-log).

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
