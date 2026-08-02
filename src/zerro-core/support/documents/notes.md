# Zerro Core working notes

- Updated: 2026-08-02
- Purpose: current position, remaining work, and deferred local smells.
  Implementation history stays in Git; contracts stay in
  [architecture.md](./architecture.md); settled decisions and risks stay in
  [design-ledger.md](./design-ledger.md); questions that need the maintainer
  stay in [open-decisions.md](../../../../docs/open-decisions.md).

## Current position

The behavioral migration is complete: production reads and writes go through the
domain namespaces of `zerro-core/redux`; legacy model objects, generic patch
APIs, and duplicate derived projections are gone; Redux owns durable
`base + outbox` plus a session-only `redo` stack and persists only the applied
command outbox; sync uses primary-only transport with whole-prefix
acknowledgement. The persisted command shape is specified once in
[architecture.md](./architecture.md#commands).

Reliable automated verification, ready bridge removal, and read-graph
simplification are done (see Git for the phase history). The code and
documentation diet and alphabetical source-layout migration are complete. The
manual completion smoke passed on 2026-07-30, so the completion gate in
[testing.md](./testing.md) is satisfied and the Core migration is closed.

The local CLI is also complete. Waves W-1 through W4 of
[local-tooling.md](./local-tooling.md) shipped: the headless Core boundary,
an atomic private replica, bounded reads, envelope-budget and transaction
preview/stage, outbox undo, and explicit sync. No MCP adapter ships with it;
that surface belongs to the open desktop-host question.

Remaining work is the change history and restore feature decided on 2026-07-31,
whose store diff and backup import shipped on 2026-08-01, payee-to-merchant
promotion decided on 2026-07-30, and materializer cascades that
are not yet reachable. Questions still waiting on an
answer live in [open-decisions.md](../../../../docs/open-decisions.md).

## Remaining work

### 1. Materializer rules

The rule set, its evidence, and the per-rule verification requirements live in
[materialization.md](./materialization.md). Implement one rule per checkpoint.
Rules 1 (deleted transactions ignore patches), 2 (the verified same-account
permanent-delete write purges the row), and 3 (account balances follow
transactions) are done. Account, tag, and merchant cascades are now reachable
through restore; an active debt reference deliberately blocks merchant removal.

### 2. Pull-only automatic sync — shipped, one part deferred

Decided 2026-07-30, implemented 2026-07-31 (see
[design-ledger.md](./design-ledger.md#replica-and-sync)). `src/4-features/sync.ts`
now exposes `syncData` (push plus pull) and `refreshData` (pull only, sending
the cursor alone and acknowledging nothing). Background sync and post-login use
`refreshData`; `src/3-widgets/RefreshButton.tsx` is the only remaining pusher,
which makes the "a push is always a deliberate user action" rule auditable by
grep. `regularSyncPolicy.ts` was untouched — it decides _when_, not _what_.

`acceptCanonicalPatch` shipped with it: a canonical base change now clears
`redo` only when it acknowledges a sent prefix, so background pulls no longer
discard the undone tail. Manual sync still clears it up front.

One follow-up did not ship: **the restored-outbox notice.** Loading with a
non-empty outbox should say so and offer a manual sync. Deferred deliberately to
the change-history screen (item 4), which is the same surface. The leave
confirmation in `RegularSyncHandler.tsx` still fires meanwhile.

### 3. Payee-to-merchant promotion

Decided 2026-07-30 (see
[design-ledger.md](./design-ledger.md#product-rules)). Renaming a payee
envelope creates or renames a merchant and attaches the matching transactions
to it, replacing the current explicit refusal in
`internal/domain/zerro/envelopes/commands.ts` and its `TODO`.

Two constraints make this more than a rename: it must be one command so undo is
atomic, and it changes the envelope id from `payee#…` to `merchant#…`, so the
envelope's budget, goal, parent, group, and visibility metadata must move with
it. Compare resulting state, not patch shape.

### 4. Change history and restore

Revised 2026-08-02 (see
[design-ledger.md](./design-ledger.md#change-history-and-restore)). Balance
prediction landed first, then the store diff of step 1. The journal shape and
initial retention defaults are now settled; real-account measurement is a later
tuning task, not a prerequisite for implementation.

While finishing the journal migration, improve full-backup restore according to the
checkpointed [restore improvement plan](./restore-improvement-plan.md). It is
the authoritative next-step plan for strict complete-backup validation, the
pending-outbox export warning, user settings and reminder-marker coverage,
semantic reconciliation with fresh ids, reference remapping, and deletion
cascades. Keep the public `core.restore` surface and the ordinary-command write
path while executing it.

The pure journal transition, branch compaction, validation-status shape,
versioned persistence parser, Redux load restoration, canonical append, journal
persistence middleware, and the explicit full-reload network path shipped
2026-08-02 in
`internal/operations/replication/journal.ts` and
`runtime/persistence/journalPersistence.ts`. Redux load/recovery and canonical
sync wiring now run in a compatibility phase: the shipped runtime still keeps
its existing persisted base while duplicate-base removal and automatic recovery
from a malformed journal are developed. `reloadData()` starts a new active
branch from a complete server snapshot and preserves the previous branches for
read-only history. Canonical boundaries now apply the three-month age policy
and enforce the hard budget by pruning the oldest sealed branches; the soft
threshold is reported by the retention helper as a compression signal, but no
codec is shipped yet.

1. ~~`diffStores(current, desired, scope) -> TIntentPatch` plus backup
   import.~~ Shipped 2026-08-01. The internal `buildRestorePlan` first maps
   desired IDs to live same-ID or semantically equal rows, then allocates fresh
   IDs and rewrites dependent references. Preview uses deterministic temporary
   IDs; apply recomputes with real UUIDs at dispatch time rather than trusting
   the preview. The app reads the existing export format and confirms the counts
   before issuing anything. Restore of a history point is the same call with a
   replayed snapshot instead of a parsed file. Account, tag, and merchant
   removal are available; merchant removal remains blocked only by an active
   debt reference, matching the server's silent no-op.
2. Tune retention from a real checkpoint and compact-transition run when
   evidence is available. The initial policy is three months, a 50 MiB soft
   compaction/compression threshold, and a 100 MiB hard journal budget; this is
   not a gate for step 3 —
   [open-decisions.md](../../../../docs/open-decisions.md#6-retention-budget-for-the-change-log).
3. Compatibility load, canonical append, journal persistence, explicit
   full-reload branch creation, and retention pruning shipped 2026-08-02.
   Remove the duplicate persisted base, add a compression codec for the soft
   threshold, and add automatic recovery from an invalid active branch.
   Journal storage already joins logout clear.
4. History screen: server points open in isolated read-only time travel;
   pending outbox commands appear as a transient undo/redo tail rather than
   journal entries. Add lazy snapshot validation and versioned point statuses.
5. Scoped restore from a validated point. Global restore last, behind its own
   confirmation.

The history screen is also the home for two already-decided app behaviors:
the restored-outbox notice from pull-only sync (item 2) and the visible
undo/redo controls of
[open-decisions.md](../../../../docs/open-decisions.md#5-visible-undoredo-controls).
Build them as one surface rather than three features.

Balance prediction was sequenced before this deliberately: a history that says
"you changed this" while the account balance had not moved would have been worse
than no history.

### 5. Local agent tooling — follow-ups only

The MVP is complete; see the follow-up list in
[local-tooling.md](./local-tooling.md#post-mvp-follow-ups). Nothing there is
scheduled. Take an item only when a real agent session needs it, and keep the
MVP contracts: no implicit refresh, no combined stage-and-sync, no raw patch
surface, and no Core internal imports from `tools/zerro`.

Balance prediction has landed, so previews now show a predicted balance rather
than an unchanged one. `balancePendingCanonicalSync` stays: it discloses that
ZenMoney has not confirmed the number, which is still true.

## Deferred until evidence exists

- semantic Redux-backed engine facade;
- published package exports and supported implementation subpaths;
- presentation package split and asset-resolver API;
- visible undo/redo controls beyond the existing keyboard shortcuts;
- replica migration framework or atomic multi-store persistence;
- generic graph/configuration framework;
- richer demo runtimes and speculative bulk APIs.

## Choosing work

- Change history and restore is the current work. The remaining materializer
  rules are all blocked on deletion commands that do not exist yet, so they are
  no longer the default filler.
- Local tooling follow-ups are demand-driven, not a queue to work through.
- A concrete product regression may override this order; document the evidence
  when it does.
- An item in [open-decisions.md](../../../../docs/open-decisions.md) is not
  implementation work until its decision is recorded in
  [design-ledger.md](./design-ledger.md).

## Deferred local smells

Concrete local smells that do not yet justify architectural work. Remove a note
when it is fixed or promoted into a decision.

### Dynamic normalized-patch plumbing

`domain/zenmoney/applyPatch.ts` and
`domain/zerro/hidden-data/write.ts#mergeNormalizedPatches` use dynamic entity
keys and still need `@ts-expect-error` or `as never`. The behavior is
centralized and tested. If these files change for domain reasons, prefer one
small explicit entity-map helper over a mapped-type framework.

### Reminder command atomicity

Reminder `set` accepts create drafts, update patches, arrays, and mixed arrays.
Split create/update/bulk commands only when a new use case defines receipts,
partial failure, and atomicity.

### Date guards validate shape only

`isISODate` and `isISOMonth` accept correctly shaped invalid calendar values.
Add calendar validation only at a boundary with a demonstrated bad-data case.

### Knip findings

Knip is configured from the real app, worker, and package-consumer entrypoints
(audit 2026-07-14: no unused files). Remaining findings are unused exports and
types; Knip output is evidence for an audit, not automatic deletion authority.
Knip's remaining core findings are exported types used only internally; treat
them as audit evidence, not a deletion queue.
