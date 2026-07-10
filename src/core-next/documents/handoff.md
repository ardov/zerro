# Core Next handoff

- Updated: 2026-07-10
- Branch: `core-next`
- Worktree: clean; the branch tip is
  `Route transaction deletion and restore through the command funnel`

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
| Redux writes     | Budget, goal, envelope, and transaction delete/restore writes are semantic; other writes use patch bridges            |
| Materializer     | Identity layer is wired into every Redux local patch; server patches bypass it                                        |
| Engine           | Pure outbox reference exists; no production consumer; replay uses stored `appliedPatch`                               |
| Presentation     | Domain envelopes are headless; Redux adds localized groups, symbols, and generated/display colors                     |
| Tests            | Unit, deterministic demo parity, Redux invalidation, and opt-in private parity layers exist                           |

## Latest landed slices

The branch tip routes transaction deletion and restore through the funnel:

- `zenmoney.transaction.delete`, `zenmoney.transaction.delete.permanent`, and
  `zenmoney.transaction.restore` commands reuse the existing Core compilers;
- the adapter exports `deleteTransactions`, `deleteTransactionsPermanently`,
  and `restoreTransaction` thunks;
- the `5-entities/transaction` thunks keep their signatures and analytics
  events but delegate to the adapter commands;
- the remaining transaction thunks (mark viewed, bulk edit, apply changes,
  recreate, split transfer) still use `applyLegacyPatch`;
- funnel resulting-state tests cover soft delete, permanent delete, and
  restore-under-new-id.

The commit before it retired the compatibility envelope patch path:

- `envelopeModel.patchEnvelope`, the `zerro.envelope.patch` command, and the
  app-layer `TEnvelopeDraft` export are removed;
- Core keeps `compilePatchEnvelope` internal to the settings and structure
  compilers; envelope drafts do not cross the package boundary;
- the createEnvelope resulting-state test moved to
  `src/4-features/envelope/createEnvelope.test.ts`;
- the funnel compiles only semantic envelope commands plus `legacy.patch`.

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

No materializer rule or replica behavior is included in these slices.

## Default next task

Migrate the remaining transaction thunks described in
[roadmap.md](./roadmap.md#default-next-slice-remaining-transaction-commands):
mark viewed and bulk edit first, then apply-changes and recreate (with its
id receipt), then decide the fate of broken `splitTransfer`.

Likely files:

```txt
src/core-next/adapters/redux/commands.ts
src/core-next/adapters/redux/commands.test.ts
src/5-entities/transaction/thunks.ts
src/core-next/documents/roadmap.md
src/core-next/documents/handoff.md
```

Keep the slice bounded:

- reuse the existing Core transaction compilers; do not fork their logic;
- commands compile intent only; account-balance effects stay reserved for the
  materializer phase;
- `recreateTransaction` keeps returning the new id (receipt flow, like
  `createEnvelope`);
- do not start materializer rules; deleted-transaction immutability belongs
  there, not in commands.

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

The transaction delete/restore slice and the preceding envelope command
slices were verified with:

```bash
pnpm exec tsc --noEmit
pnpm exec vitest run
```

Expected full-suite baseline at this handoff:

```txt
69 test files passed, 4 skipped
247 tests passed, 6 skipped
```

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
