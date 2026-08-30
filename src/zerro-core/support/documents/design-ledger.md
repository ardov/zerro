# Zerro Core design ledger

- Updated: 2026-08-22
- Purpose: settled decisions, accepted risks, active bridges, and open questions
  — each stated once, with only the reasoning that keeps it from being
  re-litigated. Implementation history stays in Git. Questions that need the
  maintainer rather than an implementer live in the private `open-decisions.md`,
  outside this repository; an answer becomes a settled decision here.

## Settled decisions

### Module and package boundary

- Zerro Core is an internal source module. The repository-local CLI
  ([local-tooling.md](./local-tooling.md)) shipped as a real headless consumer
  without publishing or moving Core — the evidence that the source boundary
  holds.
- The entrypoints, and nothing else: root `zerro-core` (constants, shared root
  types, snapshot session), `zerro-core/redux` (the app's namespace-first
  adapter), `zerro-core/replica` (store and worker seam — internal, not a
  semantic API), `zerro-core/headless` (non-Redux; only the reads, semantic
  commands, and replica capabilities the CLI needs). `domain`, `application`,
  `infrastructure`, and `presentation` are internal paths. No entrypoint exports
  an internal barrel.
- Redux is the only reactive replica owner. The CLI owns one non-reactive
  `base + outbox` document and reuses the same pure outbox operations. Canonical
  patch acceptance, empty-replica creation, and cursor overlap are pure Core
  operations; no headless consumer reimplements them.
- One semantic engine: `zerro-core/headless` and `core.transactions.create` both
  delegate to the same compiler and command/outbox path.
- npm publication, an `exports` policy, and a physical package move stay
  deferred until a second real consumer needs them.

### Reads and Redux adapter

- Session reads are grouped by domain and use `get*` names.
- The projection dependency graph is declared once in
  `internal/projections/graph.ts` and instantiated by both runtimes, so they
  cannot drift: a session binds each node to one frozen snapshot, the Redux
  adapter keeps one instance and memoizes across snapshots. The wiring is the
  reference; there is no hand-kept diagram.
- Memoization is a per-node decision, not a default: expensive nodes for cost
  (`buildRawActivity` ~18 ms, `buildBalances` ~10 ms on a 16866-transaction
  store), cheap-but-allocating nodes only so dependents keep their reference,
  and nodes returning a primitive or a pass-through store map not at all.
  `inBudgetAccountIds` also uses result equality, so an unrelated account edit
  does not invalidate the activity chain.
- The graph reads `now()` per call, so the long-lived Redux instance follows the
  clock while a session freezes `now` at construction.
  `projectionStability.test.ts` guards the whole-store-dependency and
  result-equality contracts.
- Selectors, hooks, commands, and app-facing types live in their domain modules.
  `runtime/redux/state.ts` owns only the complete-snapshot path, entity modules
  own narrowing selectors, `commandRead.ts` owns command-time reads.
- Domain functions take the entity map directly, or a small inline object of
  named maps when they need several. One-field `*Source` aliases and identity
  getters are intentionally absent.
- Domain namespaces are the desired adapter shape: add and retain members only
  for real consumers.
- Activity and budget projections retain aggregate amounts and counts, never
  transaction arrays; lists filter the canonical history on demand.
- Transaction filters are typed query clauses. Intrinsic clauses compile from
  fields; activity and envelope clauses use the same pure routing projector as
  activity calculation, with context prepared at the adapter boundary. Clauses
  compose with AND, values inside one clause with OR, and sets and envelope
  scope compile once outside the transaction loop.
- Display names, duplicate-name labels, tag child lists, colors, icons,
  localization, and asset URLs stay outside domain Core.

### Commands and materialization

Command shape, upsert semantics, the materialization pipeline, and the ownership
split live in [architecture.md](./architecture.md#change-pipeline). Not restated
there:

- Writable field lists document the domain capability, not current callers:
  every non-managed changeable field is accepted, persisted, and materialized
  before a UI exposes it.
- `materializeCommand` may diverge from `materializePrimaryCommand` — the first
  predicts server effects for local `current`, the second is the transport
  source. Purging a transaction whose stored amounts are both zero is the first
  such case and must stay one: sending the predicted `deletion` would make
  ZenMoney soft-delete instead of purge.
- Predicted balances never convert currency, and no future rule may make them.
  Each side of a transaction is already in its own account's currency, so a
  cross-currency transfer expresses its rate as the pair of stored numbers, and
  a foreign original amount lives in `opIncome`/`opOutcome`, which the rule
  excludes.

### Replica and sync

The replica model, undo/redo rules, commit boundary, primary-only transport, and
conflict policy live in [architecture.md](./architecture.md#replica-model). Not
restated there:

- Applied unsynchronized commands are the durable outbox and the undo stack.
  Redo is session-only and resets on reload, sync, canonical rebase, and logout.
- Platform history shortcuts map to undo/redo only outside text-editing controls
  and only when that direction is available.
- Logout resets replica state immediately and awaits an ordered storage clear;
  queued saves from the previous login are invalidated.
- Background sync does not classify commands as rebase-safe versus blocking:
  every admitted command follows the same sparse replay contract.
- Pushing is always a deliberate user action, so automatic sync is pull-only: a
  push clears the acknowledged prefix and with it the undo history the user
  still expects. `syncData` pushes and only the refresh control calls it;
  `refreshData` pulls and is what background sync and post-login use.
- `redo` survives a pull and is cleared only by an acknowledgement. Manual sync
  still clears it up front through `prepareClientSync`, keeping the commit
  boundary where it was recorded. Otherwise pull-only sync would fix undo while
  still discarding redo every few idle minutes.
- Unsynchronized intent is never silent: a leave confirmation before unload, and
  a notice after load when the restored outbox is not empty. Nothing else
  distinguishes "saved locally" from "saved in ZenMoney".

### Change history and restore

The app keeps a user-visible change history and can restore any retained valid
point. What is still open is listed in
[notes.md](./notes.md#remaining-work).

#### The journal

- The journal is not the outbox. The outbox is what must still be sent and is
  truncated on acknowledgement — the temporary undo/redo tail after the last
  server point. The journal is the durable record of accepted server state: one
  linear sequence of checkpoints and compact canonical transitions. Replaying
  from the latest checkpoint yields `base`; `base + outbox` yields `current`.
- A transition is a compact normalized delta — changed fields, deletions, new
  cursor — not a raw ZenMoney response and not a restore intent, and it must
  satisfy `applyPatch(before, transition) === after`. An empty pull creates no
  point; one successful push creates exactly one, covering the accepted local
  and remote changes together.
- Compaction folds only the oldest prefix into a `retention` checkpoint and
  never renumbers, so every retained point stays forward-replayable. Retention
  is the stricter of 90 days of server time and 100 MiB of logical entry bytes,
  both tunable. One checkpoint plus the outbox is the minimum durable replica
  and may exceed the budget.
- There are no branches: a full reload appends another checkpoint to the same
  line, so older history stays reachable through ordinary retention.
- Validation runs on the reconstructed `base` at load, not on every response:
  root and debt cardinalities, references, tag-parent cycles. A failure keeps a
  structurally valid outbox, raises the session-only `journalRecoveryRequired`
  flag, and is resolved by a full reload that writes a `recovery` checkpoint. A
  historical point is validated when opened and is simply unavailable if that
  fails; there is no cached per-point status.
- A point stores one boolean, `pushed` — the only record of cause the journal
  keeps. It exists so the list can collapse consecutive pull points into one row
  while every deliberate push stays visible on its own, and it is not a step
  toward a per-point audit trail.

#### The history surface

- The list is one read-only ordered projection over journal replay: redo tail,
  applied local commands, journal points. There is no `/history` route — the
  sync button is the sole entry point, where a click pushes and a right-click or
  long-press previews the list's live end, and an action there expands into a
  non-modal panel: a right drawer on desktop, a full-screen sheet on mobile,
  which gives back the width it takes rather than covering the app it sits
  beside.
- Order is not time. `current = base + outbox`, so a background pull inserts a
  journal point _under_ unsent local commands although it arrived later. A
  divider marks the boundary; it is not read as a timestamp.
- Selecting a row below the redo tail changes Core read selectors but never the
  live `base + outbox`; commands and patches are blocked and restore is the only
  write. A collapsed run of pull points is a position as well as a row — it
  stands in for its newest point, which makes it one step rather than none —
  until it is expanded, when it becomes the header its own points hang under and
  stops being a position. Checkpoints open and restore like any other point;
  nothing in the projection may special-case one into being unopenable.
- The surface never claims to be live when it is not, or past when it is not.
  The newest row is the live replica under another name, so selecting it
  normalizes to no selection at all — as a read selector rather than a
  dispatch-site guard, because an undo can shorten the outbox until the selected
  position _is_ the head and the app has to become editable again without
  waiting for the user to notice. Issuing a command likewise clears the
  selection, since an append proves the stored position stale. And if a
  background pull compacts the open point away, the panel and status bar say so
  instead of quietly falling back to live data.
- The status bar is a browsing mode, not a rendering of the selection: it opens
  on selection and closes only on its own exit control or Escape, so stepping
  forward onto the head — which is no selection — leaves it in place. Every
  control stays mounted and toggles `disabled` instead of appearing and
  disappearing, and none changes meaning between states: go-to-current jumps and
  never exits, exit never jumps, and restore is the only action that ends the
  session, because it writes. The bar sits at the top of the content column,
  clear of both the mobile bottom navigation and the fixed navigation drawer.

#### What a row shows

- A point shows its own diff — `compactCanonicalTransition` against the previous
  point — which is already what `transition` stores, so it needs no replay and
  never changes once written. The diff against live state, which is what a
  restore would overwrite, is computed on demand in the panel. An applied local
  command shows its label, falling back to its materialized diff; a checkpoint
  has no diff, being a state rather than a change.
- Labels are captured at issue time as an inert optional
  `label?: { verb, args }` on `Command` and are never stored in the journal: a
  push squashes however many commands it acknowledges into one transition, and
  the command is the only carrier that survives issue, undo/redo, and push. So
  history older than the last push has no label, and every row must survive a
  missing one. `args` carries the referenced id and a name snapshot, so a later
  rename still resolves through the id while a deletion renders under the name
  it had. Verbs are a closed union in Core, making a missing translation a
  compile-time gap rather than a blank label. A label stays inert:
  materialization and transport never read it, and a corrupt one is dropped
  without failing its command — a bad label must never be why a durable outbox
  fails to load.
- Zerro's own state — goals, envelope budgets and metadata, FX rates, the other
  `HiddenDataType` payloads — lives as JSON in one `reminder` `comment` per
  month, so a changed goal would otherwise read as "1 reminder changed".
  Decomposition splits by cost. The **type** is readable from the changed
  comment alone, so a row reports the `HiddenDataType` (`goal`,
  `envelope-budget`, `fx-rates`, and the rest) in place of `reminder`, counting
  monthly records. The **key** needs the payload as it was before, hence a
  replay, so it belongs to the panel's restore preview where the point is
  replayed anyway; there `summarizeStoreDiff` compares both comments and counts
  payload entries, including those a deleted hidden-data reminder takes with it.
  Splitting the two keeps the row's "no replay" rule intact. This is a
  presentation pass over the ZenMoney-entity diff, never a second diff over
  derived Zerro state — balances and activity would make every transaction look
  like it changed a dozen envelopes — so `tag`, `account`, and `merchant` keep
  their own entity type and only join an envelope's group. An unparseable
  payload falls back to the raw entity row. The diff view is read-only.

#### Restore

- Restoring a journal point and importing a backup are one operation:
  `buildRestorePlan(current, desired, { scope, allocateId }) -> TRestorePlan`
  produces an ordinary command's intent patch, so restore inherits
  materialization, transport, and undo-before-push, and its accepted canonical
  response becomes a journal point. There is no second write path into the
  store. Preview gets deterministic temporary IDs; apply gets real UUIDs at
  dispatch, recomputing the diff rather than issuing the preview's patch — a
  pull can land between the two, and a restore is defined against the store it
  is applied to. The preview is a count, not a promise.
- Restoring a local (unsent) point is a plain undo to that position, not a
  diff-and-append: diffing would ask `buildRestorePlan` to emit a `deletion` for
  an entity the server has never seen, which the transport must never send.
- Restore never reuses an absent backup ID. A live same-ID entity is updated in
  place; otherwise an exact semantic match is reused once, and an unmatched
  creatable entity gets a fresh ID with every dependent reference remapped.
  Desired deleted transactions stay absent, current deleted transactions never
  return under their old ID, and a desired live transaction with no semantic
  replacement gets a fresh ID — so repeating a restore converges instead of
  producing a second command.
- Accounts are exempt from the semantic match above: a backup account is
  reconciled to a live account only when their IDs are equal, never by
  resemblance. Reusing a resembling account forces every operation inside it
  to be removed one at a time as a soft delete, and a soft delete is a
  permanent server-side ratchet, so the account would survive forever carrying
  struck-through rows; deleting it instead hard-purges the operations wholly
  contained in it, which is observed server behaviour. This is a global rule,
  not a foreign-import special case, and it knowingly weakens the convergence
  promise above: a restore converges only where identifiers match, which is
  every ordinary same-account restore. It does not converge for an account
  whose ID is absent, so repeating a restore that creates accounts rebuilds
  rather than converges.
- An operation whose both legs sit on accounts a restore is deleting carries no
  soft delete of its own — the account deletion already purges it, and a
  redundant soft delete would both bloat the push and leave the local replica
  holding a tombstone the server does not have. An operation with a surviving
  leg is still removed explicitly, which includes every debt operation, since
  the debt account singleton above is never removed.
- A restore removes a row the way that entity type is removed at all: soft
  delete for transactions, zeroing for budgets, a real `deletion` for accounts,
  merchants, tags, reminders, and reminder markers, and nothing for the user
  row. The cascades those deletions set off are predicted locally —
  [materialization.md](./materialization.md) rules 4-7 — so a removed account,
  tag, or merchant does not leave transactions pointing at a missing row. Two
  removals are deliberately skipped because the server refuses them and
  predicting one would make `current` lie until the next sync: the debt account
  singleton, and a merchant still referenced by an active debt transaction.
- Restore never truncates the timeline — its response appends a later point.
  Dropping later points would destroy both the record of what was overwritten
  and the ability to restore back.
- Scoped restore (one account, envelope, or month) is the intended primary
  form, with global restore as an escape hatch behind its own confirmation,
  because a rewind is only safe where the user knows what it overwrites. Only
  the global form is built: a history point restores whole, and a backup import
  is always a complete snapshot. Scope is tracked as remaining work in
  [notes.md](./notes.md#2-scoped-restore).

Backup import is the file-shaped form of the same operation, and carries its own
settled rules:

- Only a complete backup produced by Zerro is importable; an incremental or
  partial ZenMoney diff is not a backup. There is no format envelope and no
  version field — the exported shape is the contract, and an incompatible change
  to it requires an explicit validator update.
- Export reads `state.data.base`, so pending local commands are never part of a
  backup. When the outbox is not empty, export says so and lets the user cancel
  or download anyway; it never triggers a sync to make the file complete.
- Import is same-account only. Cross-account migration is a separate feature and
  must never be inferred from a structurally valid file.
- Read-only dictionaries — `instrument`, `country`, `company` — are validated
  but never written, and user billing and subscription fields are never
  restored.
- Out of scope by decision rather than omission: partial or merge import,
  exporting `current`, restoring an outbox from a backup, automatic sync after a
  restore, and splitting one restore across several network requests.

Restore is not undo, and three consequences must be visible in the UI rather
than only recorded here. The backup-import confirmation states all three and
shows the per-entity counts the restore would write:

- it overwrites concurrent changes from other devices inside its scope — the
  motivating "my phone changed something" case is exactly when other real edits
  also exist, which is why scope is the primary control;
- it is lossy for deletions: `deleted: true` is a server-side ratchet and a
  purged id is a permanent tombstone, so a removed transaction can only come
  back under a new id, losing its identity and references;
- a large restore is one big push against the accepted whole-prefix
  acknowledgement risk, so a partial silent rejection can land a state that is
  neither the chosen point nor the current one. The point immediately before a
  restore is therefore exempt from pruning, so a restore is always reversible by
  another restore.

### Product rules

- Renaming a payee envelope promotes it to a merchant: a matching merchant is
  renamed and every transaction that carried only the raw payee string is
  attached to it, otherwise the merchant is created first. The several raw
  spellings behind one visible payee therefore collapse under one merchant
  instead of being rewritten one by one.
- The promotion is one command, so undo reverses the rename, the creation, and
  every attachment together. It also changes the envelope id from `payee#…` to
  `merchant#…`, so it must carry the envelope's metadata — budget, goal, parent,
  group, visibility — to the new id rather than orphaning it.

### Testing

- Focused domain and contract tests protect behavior, Redux invalidation tests
  protect memoization edges, and deterministic demo data protects representative
  public graph behavior.
- Legacy parity tests are temporary bridges and leave with their implementation.
- Trivial map access and self-consistency tests are not valuable by default.
- The default parallel suite must pass; serial-only green is diagnostic, not a
  completion result.

### Local tooling

- One CLI with bounded JSON output. Shell access plus machine-readable help and
  explicit side-effect metadata proved sufficient for a maintainer in a
  repository checkout, so no MCP adapter ships. An adapter stays open only as
  part of a different product question — a desktop host that embeds Zerro and
  owns the ZenMoney token, so nobody pastes one into a terminal
  (`private/open-decisions.md` § 1) — and would be justified by distribution,
  not agent ergonomics. If it ships it delegates to the same application
  functions, maps one-to-one onto CLI commands, and holds no logic of its own.
- Preview, local stage/undo, and remote sync are separate commands. Reads and
  previews never mutate implicitly, nothing combines stage with sync, and
  preview is not persisted — stage recompiles semantic input against the latest
  local `current`.
- Outbox mutations require caller-provided request ids; one bounded cache of
  recent receipts makes retries idempotent without becoming a proposal store,
  history, or audit database. Refresh is naturally repeatable and skips it.
- One profile, one endpoint (`ZERRO_ENDPOINT`, default `ru`), one JSON state
  document, one environment-provided token. No OAuth, keychain, multi-profile
  database, capability system, daemon, or network listener.
- The document persists replica truth only as `base + outbox` — `current` is
  derived, redo is session-only — plus the bounded request cache and nothing
  else. The tool owns its parser: Core exposes durable command-array validation,
  but the browser's persisted-replica migration parser does not belong in the
  headless boundary. Concurrent writers are out of scope, but atomic file
  replacement is still required against truncated local state, and the document
  uses private directory and file permissions.
- Stable ids come from bounded reads. Automatic title matching is deferred
  rather than choosing an ambiguous entity: entity options resolve a stable id
  or an exact case-insensitive title, never a substring match. Shared read
  options keep one name and meaning across every read that offers them.
- Writes stay semantic and narrow. They reuse Core's compilers and materializers
  — a budget update is one bounded batch of explicit `set` and `clear`
  operations delegated to the existing `compileSetBudget` routing — and never
  expose a raw patch, hidden reminder payload, or durable redo tail. The CLI
  validates only its external JSON contract and resolves references for bounded
  errors, without rebuilding factory defaults or predicting balances. Envelope
  creation, rename, settings, and structure mutation, and transaction update and
  delete, stay out of scope.
- Sync is explicit and reuses the Core primary-only transport and canonical
  prefix acknowledgement, accepting the same whole-prefix and silent-drop risk
  as the app; satisfaction checks, quarantine, and retry are deferred. An empty
  outbox never needs a token or the network path, an explicit 4xx refusal is a
  definitive local no-op, and any uncertainty after the request may have reached
  ZenMoney preserves the outbox and reports an unknown, non-retryable outcome
  rather than inviting a blind retry.

## Accepted product risks

- Upsert may recreate an entity that disappeared remotely while a local patch
  remained pending.
- A successful response is trusted as whole-batch acknowledgement, so a server
  that silently rejects part of a request can cause local intent to be dropped.
  Probing confirmed the mechanism exists — an older or equal `changed` is
  ignored under HTTP 200, and some invalid field values are dropped while the
  write applies — and the product accepts the risk to keep one stable
  whole-prefix acknowledgement rule.
- Persisted replica V2 has a one-way compatibility reader that preserves its
  applied prefix and discards its redo tail: a bounded migration, not a general
  migration framework.

## Active compatibility bridges

- `6-shared/types` is the intentional compatibility facade for Core-owned
  normalized types. Move consumers gradually; do not perform a big-bang type
  migration or widen the Core root to expose implementation barrels.
- App tag SVG and assets remain outside domain Core, while package-safe emoji
  metadata lives in `presentation/tag-icons`.

Keep both until a real consumer or a package decision makes their exit useful.

## Open questions

The ones that need the maintainer's answer before any implementation are
restated with their options and consequences in the private `open-decisions.md`.

- Which real ZenMoney responses become fixtures for the account-deletion and
  transfer-survivor cascades, when those rules become reachable? The balance
  rule needed none: probing had established the formula, and the rule performs
  no currency conversion, so no unverified assumption was left.
- Future command-shape changes need an explicit compatibility decision; do not
  add a general migration framework without evidence.
- How do real-account transition sizes compare with the initial retention
  defaults? A follow-up measurement, not an implementation gate
  (`private/open-decisions.md` § 5, retention budget for the change log).
- Not scheduled: does a second external consumer justify publishing or
  physically moving the Core package? Which presentation assets need a supported
  package boundary? Which package subpaths should exist if Core becomes
  publishable?

## Update rules

- Move an answer into settled decisions only when it is implemented or
  explicitly accepted.
- Remove a bridge with its last consumer.
- Remove an item from the private `open-decisions.md` in the same commit that
  records its answer here.
- Put concrete local smells in [notes.md](./notes.md).
- Put implementation history in Git, not this ledger.
