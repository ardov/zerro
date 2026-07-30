# Zerro Core working notes

- Updated: 2026-07-30
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

Remaining work is materializer rules plus two app behaviors decided on
2026-07-30: pull-only automatic sync and payee-to-merchant promotion. Questions
still waiting on an answer live in
[open-decisions.md](../../../../docs/open-decisions.md).

## Remaining work

### 1. Materializer rules

The rule set, its evidence, and the per-rule verification requirements live in
[materialization.md](./materialization.md). Implement one rule per checkpoint.
Rules 1 (deleted transactions ignore patches) and 2 (the verified same-account
permanent-delete write purges the row) are done; balances are the next valuable
one because they are the remaining rule with a visible wrong number today.
Account, tag, and merchant cascades become reachable when the matching deletion
commands ship.

### 2. Pull-only automatic sync

Decided 2026-07-30 (see [design-ledger.md](./design-ledger.md#replica-and-sync)):
automatic sync must never push. Today it does, so the undo history is silently
truncated roughly every two minutes of idle time.

What has to change:

1. `src/4-features/sync.ts` needs a pull-only path — the canonical cursor
   request with no transport entities and `sentOutboxCount: 0`, so pending
   commands rebase instead of being acknowledged. Core already supports this;
   the CLI `refresh` is the same transition.
2. `src/3-widgets/regularSyncPolicy.ts` keeps deciding _when_ to pull. The
   background handler stops choosing to push at all.
3. Loading with a restored non-empty outbox shows a notice with a manual sync
   action.

Already in place: the leave confirmation in
`src/3-widgets/RegularSyncHandler.tsx` fires whenever the outbox is not empty.

Verification: the replica/sync row of [testing.md](./testing.md) — a pull with
pending commands must rebase them and keep the undo stack, and no automatic
path may clear an outbox prefix.

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

### 4. Local agent tooling — follow-ups only

The MVP is complete; see the follow-up list in
[local-tooling.md](./local-tooling.md#post-mvp-follow-ups). Nothing there is
scheduled. Take an item only when a real agent session needs it, and keep the
MVP contracts: no implicit refresh, no combined stage-and-sync, no raw patch
surface, and no Core internal imports from `tools/zerro`.

Until balance prediction lands, transaction previews must keep stating that
canonical account balances may change after sync.

## Deferred until evidence exists

- semantic Redux-backed engine facade;
- published package exports and supported implementation subpaths;
- presentation package split and asset-resolver API;
- visible undo/redo controls beyond the existing keyboard shortcuts;
- replica migration framework or atomic multi-store persistence;
- generic graph/configuration framework;
- richer demo runtimes and speculative bulk APIs.

## Choosing work

- Materializer rules are the default next work; split by contract, one rule per
  commit.
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
