# Core Next handoff

- Updated: 2026-07-10
- Branch: `core-next`
- Last commit before the current worktree: `3dacae0f Add semantic envelope comment command`

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
| Redux writes     | Budget, goal, and envelope commands use the command funnel; legacy writes still use patch bridges                     |
| Materializer     | Identity layer is wired into every Redux local patch; server patches bypass it                                        |
| Engine           | Pure outbox reference exists; no production consumer; replay uses stored `appliedPatch`                               |
| Presentation     | Domain envelopes are headless; Redux adds localized groups, symbols, and generated/display colors                     |
| Tests            | Unit, deterministic demo parity, Redux invalidation, and opt-in private parity layers exist                           |

## Current worktree slice

The uncommitted slice introduces explicit envelope settings:

- `compileUpdateEnvelopeSettings` accepts the five fields the form actually
  edits: name, configured color, currency, visibility, and keep-income;
- entity and metadata changes compile into one atomic patch;
- the Redux adapter normalizes unchanged localized null-tag presentation;
- EnvelopeEditDialog is edit-only and uses `updateEnvelopeSettings(input)`;
- dead UUID/create behavior and hidden parent/group/comment/carry fields are
  removed from the form contract;
- domain and adapter tests verify no-op and resulting state.

No other envelope field, materializer rule, or replica behavior is included.

## Default next task

Implement semantic envelope create described in
[roadmap.md](./roadmap.md#default-next-slice-semantic-envelope-create).

Likely files:

```txt
src/core-next/zerro/envelopes/commands.ts
src/core-next/zerro/envelopes/commands.test.ts
src/core-next/adapters/redux/commands.ts
src/core-next/adapters/redux/commands.test.ts
src/4-features/envelope/createEnvelope.ts
src/core-next/documents/roadmap.md
src/core-next/documents/handoff.md
```

Keep the slice bounded:

- use a minimal explicit create input;
- return the new envelope id as a receipt;
- preserve group/index initialization;
- migrate only the createEnvelope feature;
- retain the compatibility envelope patch command;
- do not start materializer rules; that track is explicitly last.

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

The semantic rename slice and the preceding facade/domain boundary were
verified with:

```bash
pnpm exec tsc --noEmit
pnpm exec vitest run
```

Expected full-suite baseline at this handoff:

```txt
69 test files passed, 4 skipped
240 tests passed, 6 skipped
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
