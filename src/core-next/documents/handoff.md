# Core Next handoff

- Updated: 2026-07-10
- Branch: `core-next`
- Last commit before the current worktree: `3c4d26d3 YAGNI sweep`

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
| Session          | Read-only flat `session.read.*` facade with lazy snapshot-local memoization                                           |
| Redux reads      | Most budget/envelope/goal/activity/transaction/tag/debtor/balance consumers use Core adapter selectors                |
| Redux writes     | Budget, goal, and envelope commands use the command funnel; legacy writes still use patch bridges                     |
| Materializer     | Identity layer is wired into every Redux local patch; server patches bypass it                                        |
| Engine           | Pure outbox reference exists; no production consumer; replay uses stored `appliedPatch`                               |
| Presentation     | Tag/envelope decoration remains in the Redux adapter and `populatedTags` is still a session bridge                    |
| Tests            | Unit, deterministic demo parity, Redux invalidation, and opt-in private parity layers exist                           |

## Current worktree slice

The uncommitted slice introduces and documents local patch materialization:

- `src/core-next/materializer/materializePatch.ts` returns identity
  `intentPatch`/`appliedPatch` plus `materializerVersion`;
- known future transaction/account rules are recorded beside the function;
- Redux `applyClientPatch` materializes every local patch centrally;
- Redux `applyServerPatch` treats server diffs as canonical;
- `createZerroEngine` stores intent and applied patches separately;
- reducer and engine tests protect the boundary;
- the document set has been reduced and rewritten around current decisions and
  active tracks.

No ZenMoney effect rule is implemented yet; runtime behavior remains legacy
identity behavior.

## Default next task

Implement the additive semantic read facade described in
[roadmap.md](./roadmap.md#default-next-slice-semantic-read-facade).

Likely files:

```txt
src/core-next/facade/createZerroSession.ts
src/core-next/facade/createZerroSession.test.ts
src/core-next/facade/createZerroSession.demo.test.ts
src/core-next/adapters/redux/selectors.ts
src/core-next/documents/roadmap.md
src/core-next/documents/handoff.md
```

Keep the slice bounded:

- add namespaced `get*` methods;
- retain `session.read.*` compatibility;
- add a small readable dependency map;
- do not split presentation envelopes yet;
- do not rewire Redux around one whole-store selector;
- do not begin replica-state migration in the same change.

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

The materializer and documentation slice was verified with:

```bash
pnpm exec tsc --noEmit
pnpm exec vitest run
```

Expected full-suite baseline at this handoff:

```txt
69 test files passed, 4 skipped
231 tests passed, 6 skipped
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
