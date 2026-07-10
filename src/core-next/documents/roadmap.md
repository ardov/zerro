# Core Next roadmap

- Updated: 2026-07-10
- Purpose: choose the next bounded slice; implementation history stays in Git.

## Current position

The normalized entity layer and read projection chain are broadly established.
Real app consumers already use Core Redux selectors, and budget, goal, and
envelope writes use the command funnel. The next risk is no longer missing
domain folders; it is an awkward public API plus duplicated read-graph wiring.

The materializer boundary has landed as identity-only. Replica ownership,
presentation extraction, server-like materialization rules, and package
hardening remain incomplete.

## Default next slice: semantic read facade

Goal: make snapshot reads pleasant without changing calculations or Redux
invalidation behavior.

Scope:

1. Add additive domain namespaces over the existing session nodes:

   ```ts
   session.envelopes.getAll()
   session.envelopes.getStructure()
   session.budgets.getAll()
   session.months.getList()
   session.months.getTotals()
   ```

2. Keep `session.read.*` temporarily for tests and compatibility.
3. Separate semantic public reads from internal graph nodes such as
   `fxRatesGetter`, `rawGoals`, and `envelopesCompiled`.
4. Add one small readable dependency map for important projection nodes.
5. Keep existing Redux selectors explicit and granular.

Done when:

- the new facade is covered on deterministic demo data;
- repeated session reads return the same memoized references;
- no Redux selector starts depending on the full `current` snapshot;
- root exports remain facade-only;
- architecture, handoff, and this roadmap reflect the landed API.

Do not include domain/presentation envelope splitting in this slice. That is a
separate track and deserves independent parity tests.

## Active tracks

| Track                           | State                          | Next useful outcome                                                                        |
| ------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------ |
| A. Public facade and read graph | Active, default                | Add namespaced `get*` reads and one readable graph map                                     |
| B. Domain/presentation boundary | Ready                          | Remove presentation fields from domain envelopes and design an optional appearance package |
| C. ZenMoney materializer rules  | Boundary landed                | Move one proven rule into materialization with parity tests                                |
| D. Replica and sync             | Designed, not integrated       | Share pure outbox operations and make Redux the replica owner                              |
| E. Legacy cutover               | Reads advanced, writes partial | Migrate one remaining write or deep import at a time                                       |
| F. Package and test hardening   | Ongoing                        | Consumer-level export/type test and targeted parity coverage                               |

## Track A: public facade and read graph

Goal: expose domain use cases without leaking projector assembly.

Current:

- `createZerroSession` memoizes one immutable snapshot;
- the flat `session.read.*` surface exposes semantic results and internal nodes;
- Redux independently wires the same calculation graph.

After the default slice:

1. Add domain write methods that compile narrow semantic command inputs.
2. Decide which adapter-level projectors deserve a supported subpath.
3. Add explicit singular bulk APIs only when real use cases define atomicity.

Avoid a generic graph framework until simple wiring causes repeated defects.

## Track B: domain and presentation

Goal: make Core envelope reads headless and move reusable appearance behavior
into an optional presentation boundary.

Suggested order:

1. Define the minimal domain envelope shape and classify every current field as
   domain or presentation.
2. Build a pure presenter accepting label, icon, and SVG resolvers.
3. Move generated-color, emoji, and fallback policy behind that presenter.
4. Remove `populatedTags` from the session input.
5. Later add bank-logo catalogs keyed by stable company/account metadata.

Keep localization and bundler-resolved assets outside domain Core. Compare both
stable domain envelopes and final decorated Redux views during migration.

## Track C: materializer rules

Goal: reproduce known ZenMoney cross-entity behavior in one deterministic
layer instead of every command.

Current:

- every Redux local patch passes through `materializePatch`;
- `createZerroEngine` stores intent and applied patches with a rule version;
- materialization is identity-only;
- canonical server diffs bypass it.

Recommended rule order:

1. Deleted transaction immutability: later transaction patches do nothing.
2. Transaction amount effects: update affected account balances.
3. Account deletion cascade for non-transfer transactions.
4. Transfer conversion to income/outcome on the surviving account.

For each rule:

- test the materialized patch and resulting state;
- cover batches and already-deleted entities;
- compare with a real ZenMoney response when possible;
- increment `materializerVersion` when semantics change;
- keep dumb `applyPatch` unchanged.

Before step 2 or later, settle the sync transport question in the design ledger.

## Track D: replica and sync

Goal: replace legacy `data.diff` with explicit replica state without creating a
second app store.

Suggested order:

1. Extract pure outbox operations: append, drop redo tail, clamp head, replay
   applied prefix, and list pending entries.
2. Reuse them in `createZerroEngine` and Redux reducers.
3. Move Redux state toward `base`, `outbox`, `outboxHead`, `inbox`, `current`.
4. Rebase `applyServerPatch` and expose the pending sync payload.
5. Add reload plus undo/redo tests before switching more writes.

The in-memory engine remains a reference/headless implementation. Do not run it
beside Redux in the app.

## Track E: legacy cutover

Goal: remove compatibility paths only when a real consumer can switch safely.

High-value remaining work:

- transaction/account/reminder writes still using `applyLegacyPatch` or direct
  `applyClientPatch`;
- `mergeAccounts`, which needs explicit transfer/cascade semantics;
- deep app imports from `core-next/zenmoney`, `core-next/zerro`, and tag
  presentation shims;
- compatibility re-exports under `6-shared/types`, demo data, and icon assets.

Switch one path at a time. Add parity or invalidation coverage appropriate to
that path, then update its bridge entry in the design ledger.

## Track F: package and tests

Goal: keep the package boundary trustworthy while migration continues.

Useful slices:

1. Generate declarations and compile a tiny external consumer using only
   supported entrypoints.
2. Enforce allowed subpaths once their list is settled.
3. Add demo scenarios only for genuinely distinct domain shapes.
4. Keep private fixture runs opt-in and privacy-safe.
5. Add dependency-direction checks for foundational type modules if barrel
   cycles continue to obscure the graph.

Do not add tests for trivial map lookups or speculative APIs.

## Choosing work

- Choose Track A by default.
- Choose Track B when working on tags, envelopes, icons, localization, or bank
  appearance.
- Choose Track C only for a known, testable ZenMoney rule.
- Choose Track D when changing sync, undo/redo, persistence, or Redux data state.
- Choose Track E for a single concrete app consumer.
- Choose Track F when a boundary or fixture problem blocks another track.

If a task touches more than one track, split it unless the contract cannot be
verified independently.

## Verification defaults

Focused tests first, then:

```bash
pnpm exec tsc --noEmit
pnpm exec vitest run
```

Use private fixture commands only when the ignored local fixture exists. See
[private-fixtures.md](./private-fixtures.md).
