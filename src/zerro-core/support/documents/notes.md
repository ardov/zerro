# Zerro Core working notes

- Updated: 2026-08-22
- Purpose: current position, remaining work, and deferred local smells.
  Implementation history stays in Git; contracts stay in
  [architecture.md](./architecture.md); settled decisions and risks stay in
  [design-ledger.md](./design-ledger.md); questions that need the maintainer
  stay in the private `open-decisions.md`, which is not part of this
  repository.

## Current position

The Core migration is closed. Production reads and writes go through the domain
namespaces of `zerro-core/redux`; legacy model objects, generic patch APIs, and
duplicate derived projections are gone; Redux owns durable `base + outbox` plus
a session-only `redo` stack; sync uses primary-only transport with whole-prefix
acknowledgement. The completion gate in [testing.md](./testing.md) was satisfied
on 2026-07-30.

The local CLI is complete — waves W-1 through W4 of
[local-tooling.md](./local-tooling.md). No MCP adapter ships with it; that
surface belongs to the open desktop-host question.

Change history and restore is the current work and is mostly built: the linear
journal, base validation and recovery, the restore planner with backup import,
the sync-button history surface, per-point diffs, and command labels have all
shipped. Pull-only automatic sync shipped alongside it — `src/4-features/sync.ts`
splits `syncData` (push plus pull) from `refreshData` (pull only), and
`src/3-widgets/RefreshButton.tsx` is the only remaining pusher, which keeps "a
push is always a deliberate user action" auditable by grep.

## Remaining work

### 1. Restore preview and confirmation UI

The last open piece of the restore work; everything else it depended on has
shipped. Build the preview from `TRestorePlan` rather than by retrospectively
classifying an opaque patch, listing user settings, accounts, categories,
merchants, budgets, reminders, reminder markers, transactions, unsupported
actions, and effective cascade changes.

Replace the current limitations copy now that recreation and deletion ship:
newer data is overwritten, deleted operations may return under fresh ids,
accounts, categories, and merchants may be removed after sync, the command can
be undone before manual sync, and the old server identity is not restored. Apply
recomputes after preview, so a background pull may change the counts; show the
completion snackbar only if a command was actually appended.

The settled product rules this has to respect are in
[design-ledger.md](./design-ledger.md#restore).

### 2. Scoped restore

Restoring one account, envelope, or month from a validated point. The shipped
history action is a confirmed global restore that keeps the journal timeline
intact. The per-point diff is read-only and does not add a per-row restore,
which is what scope would require for the Zerro-side rows — goal,
envelope-budget, envelope-meta — since they have no entity of their own to
target with `buildRestorePlan(scope)`.

### 3. Retention tuning

Tune from a real checkpoint and compact-transition run when evidence exists. The
shipped policy is the stricter of 90 days and 100 MiB of logical entry bytes; no
compression codec exists, and the soft threshold was dropped with the branch
model — `private/open-decisions.md` § 5, retention budget for the change log.
`replicaStorage` records `loadCurrent`, `loadHistoricalState`, and
`compactOneBatch` metrics on `window.zerro.logs` for that measurement.

Automatic network recovery from a corrupt journal is open at the same time.

### 4. Payee-to-merchant promotion

Decided 2026-07-30 (see [design-ledger.md](./design-ledger.md#product-rules)).
Renaming a payee envelope creates or renames a merchant and attaches the
matching transactions to it, replacing the explicit refusal and its `TODO` in
`internal/domain/zerro/envelopes/commands.ts`.

Two constraints make this more than a rename: it must be one command so undo is
atomic, and it changes the envelope id from `payee#…` to `merchant#…`, so the
envelope's budget, goal, parent, group, and visibility metadata must move with
it. Compare resulting state, not patch shape.

### 5. Unscheduled

- Materializer rule 8 — merchant rename rewriting `payee` on linked rows — is
  deliberately not predicted. Rules 1-7 are implemented; see
  [materialization.md](./materialization.md).
- Naming the payload entries behind a hidden-data diff and grouping them under
  their envelope. The history redesign deliberately stopped at counts: naming
  needs envelope titles, which are an app projection rather than store data.
  Take it only if the counts turn out not to answer the question in real use.
- Resolving a label's `args` id to a current name at display time. Names are
  snapshotted where the caller already has one; the display-time half is
  dormant, so a label renders its snapshot or nothing.
- Local tooling follow-ups in
  [local-tooling.md](./local-tooling.md#follow-ups). Demand-driven — take one
  only when a real agent session needs it, and keep the tool's contracts: no
  implicit refresh, no combined stage-and-sync, no raw patch surface, and no
  Core internal imports from `tools/zerro`.

## Where the replica lives

Pure transformations are in `internal/operations/replication/linearJournal.ts`;
the IndexedDB adapter and its retention policy are in
`6-shared/api/replicaStorage.ts`. The model is described in
[architecture.md](./architecture.md#replica-model) and
[ADR 0001](../../../../docs/adr/0001-linear-indexeddb-replica.md).

A replay that fails validation preserves a structurally valid outbox, sets
`journalRecoveryRequired`, and is resolved by a full reload that writes a
`recovery` checkpoint. `JournalRecoveryNotice` surfaces that state with a
confirmed full-reload action; `PersistenceWarningNotice` surfaces a failed
primary write, after which Redux stays authoritative until reload.

Transaction `incomeBankID` and `outcomeBankID` are opaque
synchronization-plugin operation IDs, so neither the store validator nor backup
compatibility treats them as `company` references.

The CLI's `balancePendingCanonicalSync` stays even though balance prediction has
landed: it discloses that ZenMoney has not confirmed the number, which is still
true.

## Deferred until evidence exists

- semantic Redux-backed engine facade;
- published package exports and supported implementation subpaths;
- presentation package split and asset-resolver API;
- replica migration framework or atomic multi-store persistence;
- generic graph/configuration framework;
- richer demo runtimes and speculative bulk APIs.

## Choosing work

- Change history and restore is the current work; items 1-3 are what is left of
  it.
- Local tooling follow-ups are demand-driven, not a queue to work through.
- A concrete product regression may override this order; document the evidence
  when it does.
- An item in the private `open-decisions.md` is not implementation work until
  its decision is recorded in [design-ledger.md](./design-ledger.md).

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

Knip is configured from the real app and worker entrypoints (audit 2026-07-14:
no unused files). Remaining findings are exported types used only internally;
treat them as audit evidence, not a deletion queue.
