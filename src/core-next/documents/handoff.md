# Core Next handoff

- Updated: 2026-07-11
- Branch: `core-next`
- Worktree: clean; the branch tip is
  `Verify Core package consumer`

This document describes the current branch, not project history. Verify its
claims against the tree before editing.

## Read order

1. This handoff.
2. [roadmap.md](./roadmap.md) for the selected track and completion criteria.
3. The relevant section of [architecture.md](./architecture.md).
4. [design-ledger.md](./design-ledger.md) before changing a boundary or bridge.
5. Entity READMEs beside `src/core-next/zenmoney/*` when working on normalized
   ZenMoney entities.

## Current branch state

| Area             | State                                                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------------------------------------- |
| Package boundary | Root exports constants, shared root types, engine, and facade only; production Core has no runtime `6-shared` imports |
| ZenMoney layer   | Normalized entities, factories, focused reads, commands, patch/replay, debtors, and balances are present              |
| Zerro reads      | Envelopes through activity, metrics, month totals, goals, budgets, settings, hidden data, and FX are present          |
| Session          | Namespaced semantic `get*` reads over lazy snapshot-local memoization; flat `read` is deprecated compatibility        |
| Redux reads      | Most budget/envelope/goal/activity/transaction/tag/debtor/balance consumers use Core adapter selectors                |
| Redux writes     | All budget/goal/envelope/transaction/account writes are semantic; no production consumer uses the legacy bridge       |
| Materializer     | Identity layer is wired into every Redux local patch; server patches bypass it                                        |
| Engine           | Pure outbox reference exists; no production consumer; replay uses stored `appliedPatch`                               |
| Presentation     | Domain envelopes are headless; Redux adds localized groups, symbols, and generated/display colors                     |
| Tests            | Unit, deterministic demo parity, Redux invalidation, and opt-in private parity layers exist                           |

## Latest landed slices

The current independent Track F slice verifies the real root package surface:

- `pnpm core-next:package-check` emits declarations from
  `src/core-next/index.ts` into a temporary directory;
- the emitted tree is installed there as a synthetic `core-next` package and a
  tiny external consumer imports only root constants, types, session, and
  engine APIs;
- consumer compilation uses normal Node package resolution rather than the
  repo's `baseUrl` alias, catching declaration leaks and unsupported imports;
- a Vitest guard runs the same check in the full suite; generated files never
  enter the worktree.

The current persistence/reload slice makes pending runtime commands durable:

- `core-next/engine/persistence.ts` defines version 1 as base server timestamp
  plus full outbox and head; derived `current`/`diff` and ephemeral inbox are
  not serialized;
- worker storage uses a separate `core-next-replica-v1` IndexedDB key, leaving
  existing ZenMoney entity keys and old installs compatible;
- Redux middleware serializes append, undo, redo, rebase, restore, and reset
  snapshots in order; worker loading is browser-only and lazy, so importing the
  store remains safe in tests and non-browser runtimes;
- local load fetches entity data and replica metadata together, applies the
  server base, then restores and replays matching pending entries;
- missing, stale-base, or unknown replica snapshots safely produce an empty
  outbox;
- tests cover snapshot shape (including redo tail), matching/stale restore, and
  end-to-end local reload with a pending command. Cross-key crash atomicity is
  not solved in this slice.

The current inbox/rebase slice prevents in-flight sync data loss:

- public `applyServerPatch` is now a synchronous thunk that stages the payload
  with `receiveServerPatch`, then applies `rebaseServerInbox`;
- sync captures the exact applied outbox entry ids present when the request
  starts and attaches them to the canonical response;
- rebase updates the server base, removes only acknowledged ids, retains
  entries appended during the request, and replays them over the new base;
- `syncStartTime` remains a fallback for older callers, avoiding timestamp
  ambiguity in the main path;
- patches without acknowledgement metadata (initial load, demo, backup)
  replace the base and clear local history;
- reducer tests cover staged inbox visibility, exact acknowledgement, retained
  in-flight commands, updated base/current/diff, and inbox clearing. Replica
  persistence is not included.

The current Redux replay slice makes the runtime outbox authoritative:

- `appendClientOutboxEntry`, `undoClientCommand`, and `redoClientCommand`
  rebuild `current` from `server` plus the stored applied prefix;
- `diff` is rebuilt from that same prefix as a temporary sync-transport
  projection, so undo/redo affects both current state and pending sync data;
- append after undo drops the redo tail and replays the replacement branch;
- canonical server patches remain the base update boundary and clear the
  acknowledged runtime outbox;
- the bypassing `applyClientPatch` reducer action/export is deleted;
- reducer tests cover base preservation, replay, undo to base, redo, diff
  projection, and redo-tail replacement. Persistence and explicit inbox/rebase
  semantics are not included.

The current slice closes the remaining direct-client-patch debt:

- a small `executeReduxCommand` module owns cycle-safe materialization and
  outbox entry construction without importing the adapter selector graph;
- the main semantic funnel delegates to that executor;
- reminder set/delete thunks use existing Core reminder compilers, preserve the
  created-reminder receipt, and append semantic commands without recreating the
  hidden-store import cycle;
- hidden data-account creation uses `compileCreateAccount` and an explicit
  `infrastructure.dataAccount.prepare` entry;
- the debug patch API uses an explicit `infrastructure.debug.patch` entry;
- no production caller dispatches `applyClientPatch` directly. Focused tests
  cover reminder receipts/deletion, data-account creation, existing-account
  no-op behavior, and outbox entry shapes.

The current Redux Track D slice adopts runtime outbox entries for semantic
commands:

- `executeCommand` now compiles and materializes against the current snapshot,
  creates a complete entry (`command`, intent/applied patches, materializer
  version, id, timestamp), and dispatches `appendClientOutboxEntry`;
- the data reducer reuses `appendOutbox`, including redo-tail truncation, while
  still updating legacy `current` and `diff` compatibility views;
- canonical server patches clear the acknowledged runtime outbox and continue
  to bypass local materialization;
- the runtime outbox fields are optional for state-fixture compatibility and
  are not persisted yet;
- this slice initially treated outbox as a transitional mirror; the subsequent
  producer cutover above removed that blocker to authoritative replay.

The current Track D slice extracts reusable pure outbox operations:

- `engine/outbox.ts` owns head clamping, applied-prefix selection, append with
  redo-tail truncation, and replay from stored `appliedPatch` values;
- `createZerroEngine` delegates those behaviors instead of implementing them
  inside its closure;
- focused tests pin clamping, pending selection, redo-tail replacement, and
  replay through the selected head;
- the operations stay internal and do not widen the root package surface;
  Redux state shape and persistence are unchanged.

The current slice makes `mergeAccounts`, the last legacy write consumer,
semantic:

- `compileMergeAccounts` reassigns source-side transactions and reminders,
  collapses transfers between source and target, folds balances, and deletes
  the source account;
- source and target must exist, differ, and share an instrument;
- `zenmoney.account.merge` routes through the Redux command funnel, while the
  existing feature thunk is now a thin compatibility delegate;
- Core resulting-state tests cover ordinary and internal transfers, reminders,
  unrelated entities, deletion, balances, and validation; a funnel test covers
  command routing.

No production code imports `applyLegacyPatch` now. The compatibility command,
export, source file, and bridge-only tests are now removed. The Core API
boundary test pins the exact supported command exports of the Redux adapter.

The branch tip makes the transaction-list bulk combine/merge actions semantic:

- `compileCombineToOutcome`, `compileCombineToIncome`, and
  `compileMergeTransactionsAsTransfer` take selected ids, group them by type,
  and compile the same delete/transfer/sum logic the widget used inline;
- funnel commands `zenmoney.transaction.combineToOutcome` /
  `.combineToIncome` / `.mergeAsTransfer` plus adapter thunks
  `combineTransactionsToOutcome` / `combineTransactionsToIncome` /
  `mergeTransactionsAsTransfer`;
- `TransactionList/TopBar/Actions.tsx` dispatches those thunks and no longer
  imports `applyLegacyPatch` or defines the mutation helpers; the currency-based
  availability checks (`getAvailableActions`) stay in the widget;
- dead `setTagBudget` and its now-unused `makeTagBudget`/`getBudgetId`
  5-entities helpers are removed (`getTagBudgets` read stays);
- Core tests cover each compiler (delete/transfer/sum, merge validation) and a
  funnel routing test covers combine-to-outcome.

The commit before it made `setInBudget` semantic and removed the dead
`patchAccount`/`patchTag`/`createTag`/`patchMerchant` thunks.

The commit before that finished the transaction thunk family:

- `zenmoney.transaction.viewed.set`, `zenmoney.transaction.update`,
  `zenmoney.transaction.recreate`, and `zenmoney.transaction.bulk.edit` join
  the delete/restore commands and reuse the existing Core compilers;
- `recreateTransaction` returns the new transaction id as a receipt, like
  `createEnvelope`;
- every `5-entities/transaction` thunk keeps its signature and analytics event
  but delegates to the adapter commands; the file no longer imports
  `applyLegacyPatch` or duplicates tag/comment merge logic;
- broken `splitTransfer` is deleted together with its commented-out consumer;
- the one remaining transaction-shaped legacy write is `combineToOutcome`
  inside the transaction list bulk actions widget;
- funnel resulting-state tests cover viewed filtering, field updates, the
  recreate receipt, and bulk edit.

The commit before it routed transaction deletion and restore through the
funnel. The one before that retired the compatibility envelope patch path:

- `envelopeModel.patchEnvelope`, the `zerro.envelope.patch` command, and the
  app-layer `TEnvelopeDraft` export are removed;
- Core keeps `compilePatchEnvelope` internal to the settings and structure
  compilers; envelope drafts do not cross the package boundary;
- the createEnvelope resulting-state test moved to
  `src/4-features/envelope/createEnvelope.test.ts`;
- the funnel compiles only semantic commands.

The earlier commit landed semantic envelope creation and structure.

Semantic envelope creation:

- `compileCreateEnvelope` accepts name plus optional group/index/comment;
- tag creation and initial envelope metadata compile into one patch;
- the receipt returns the new envelope id;
- the Redux adapter preserves receipt flow and normalizes default groups;
- the app create feature no longer chains legacy tag and envelope write models;
- creation, metadata, receipt, and stable-group behavior are tested.

Semantic envelope structure:

- `compileApplyEnvelopeStructure` compiles the full ordered hierarchy (groups,
  nesting, order) into one atomic patch; envelopes absent from the input stay
  untouched;
- normalization mirrors the projector: empty groups drop, same-named groups
  merge, deep nesting flattens to two levels, tags under virtual envelopes are
  elevated;
- index order counts every flattened node (groups included), matching the
  structure projector;
- `toEnvelopeStructureInput` converts a projected structure tree into the
  minimal command input;
- the Redux adapter maps localized default group labels back to domain ids
  before compilation (`zerro.envelope.structure.apply`);
- the four hierarchy consumers — `moveEnvelope`, `moveGroup`, `assignNewGroup`,
  `renameGroup` — dispatch `applyEnvelopeStructure` and no longer build
  `TEnvelopeDraft` patches; the legacy `applyStructure` thunk is deleted;
- an identity structure apply materializes implicit indices once and is a
  no-op afterwards; it never writes groups or parents (covered by funnel
  tests).

No materializer rule, persisted outbox, or explicit inbox/rebase behavior is
included in these slices.

## Default next task

Track D is paused for an explicit user discussion: revisit the complete sync
lifecycle, its effects on data/outbox, persistence ordering, and whether replica
migrations are needed at all. Do not add migration machinery or remove
`data.diff` before that checkpoint.

The independent root package check is complete. Until the Track D discussion,
the next safe work should be one concrete Track E deep-import cleanup or a
Track A facade slice whose public contract is already clear. Do not enforce
subpath allowlists until their supported list is explicitly settled.

## Important guardrails

- Root `core-next` stays facade-only.
- App code should prefer `core-next/adapters/redux`; deep `zenmoney`/`zerro`
  imports remain compatibility debt.
- Redux is the only reactive state owner in the React app.
- Commands compile intent; materialization owns future cross-entity effects;
  dumb patch application stays dumb.
- Server diffs bypass local materialization.
- Replay uses stored `appliedPatch`, not command recompilation.
- Pure projectors keep explicit inputs and do not import selectors.
- Presentation logic does not become domain state.
- Private fixture failures must not print private objects.
- Do not infer completion from this file; inspect code and tests.

## Verification

The bulk combine/merge slice and the preceding transaction/entity write
slices were verified with:

```bash
pnpm exec tsc --noEmit
pnpm exec vitest run
```

Expected full-suite baseline at this handoff:

```txt
69 test files passed, 4 skipped
273 tests passed, 6 skipped
```

Browser check: the transaction-list multi-select bar and bulk-actions menu
render and dispatch after the migration. The combine/merge math itself is
covered by Core unit tests and a funnel routing test rather than a live
combine-eligible selection (fixed demo data makes that selection awkward to
reproduce by clicking).

Also run formatting and documentation link checks after changing these files.
Private fixture parity is optional and requires an ignored local fixture; see
[private-fixtures.md](./private-fixtures.md).

## Known constraints

- `createZerroEngine` is ahead of production integration. Share or fold its
  outbox primitives when Redux replica work begins.
- Hidden-data reads share the reminder slice, so unrelated hidden-data writes
  can invalidate each other. Optimize only if profiling justifies it.
- Legacy selector imports have known cycles around hidden-store write paths;
  avoid widening adapter barrels into those paths.
- Golden JSON comparisons intentionally ignore `undefined` fields because JSON
  serialization drops them.
- The large private fixture is roughly 287 MB and must remain local.

## Durable ledgers

- Active tracks and next slices: [roadmap.md](./roadmap.md)
- Accepted architecture: [architecture.md](./architecture.md)
- Settled decisions, open questions, and bridge exits:
  [design-ledger.md](./design-ledger.md)
- Test selection: [testing.md](./testing.md)
