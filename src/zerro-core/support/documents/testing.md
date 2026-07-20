# Zerro Core testing policy

Tests protect domain rules, dependency boundaries, replay, and consumer-visible
behavior. They should not make thin helpers or obsolete compatibility layers
expensive to change.

## Test layers

### Focused domain and contract tests

Use for:

- patch immutability, deletion, merge, and replay ordering;
- command validation, deterministic ids/timestamps, receipts, and resulting
  state;
- materializer intent/applied contracts and cross-entity effects;
- hidden-data parsing and writes;
- envelope, budget, FX, activity, month-total, goal, and transaction edge cases;
- outbox append, undo/redo, reload redo reset, logout clearing, rebase, and
  session redo behavior;
- dependency and package boundaries.

For command changes, compare state after applying the patch. Patch shape alone
does not prove behavior.

### Deterministic demo regressions

Use `makeDemoDiff` and `makeDemoStore` with pinned time and size for
representative session and Redux graphs. Add a scenario only when it protects a
distinct domain shape.

### Redux invalidation tests

When changing selector wiring, verify both:

- unrelated slices preserve result references;
- relevant slices recompute the intended downstream nodes.

Do not select the whole `current` snapshot when granular entity slices express
the dependency.

### Boundary checks

- `api-boundary.test.ts` protects dependency direction and adapter shape.
- `pnpm zerro-core:package-check` emits declarations and type-checks a synthetic
  external consumer.
- Keep expensive package compilation explicit. Do not duplicate it inside the
  fast unit suite unless the wrapper adds a distinct contract and has a stable
  runtime budget.

## Remove low-value tests

Delete tests that only prove:

- direct map access returns the same map;
- two removed implementations agree;
- a handwritten metadata graph is internally consistent but matches no runtime
  wiring;
- a standalone verification script can be invoked from Vitest.

Keep a helper test only when it owns normalization, filtering, ordering,
validation, identity, or another named contract.

## Legacy parity exit

Every remaining legacy comparison must carry `LEGACY-PARITY BRIDGE` and a
concrete exit condition. Remove it with the legacy implementation. Preserve
only named Core behavior as direct expectations, invariants, or safe summaries.

## Builders

- `testing/zenmoneyTestData.ts` — normalized stores and entities;
- `testing/zerroTestData.ts` — Zerro projection shapes;
- `testing/demoState.ts` — pinned public demo snapshot;
- `testing/rootState.ts` — minimal Redux test state;
- `testing/stableJson.ts` — deterministic safe comparison.

Keep important scenario fields visible. Production factories must not become
permissive test builders.

## Verification matrix

| Change                      | Minimum verification                             |
| --------------------------- | ------------------------------------------------ |
| Pure helper/projector       | Focused test + TypeScript                        |
| Command compiler            | Compiler + resulting-state test                  |
| Selector wiring             | Behavior + relevant/unrelated invalidation       |
| Session/read facade         | Session + deterministic demo regression          |
| Materializer/patch apply    | Focused + reducer/engine + default full suite    |
| Replica/sync                | Reload + undo/redo + rebase + default full suite |
| Package/dependency boundary | Boundary tests + external consumer type compile  |

## Agent verification discipline

During implementation, run only the focused tests that protect the changed
contract. Do not repeat a successful check while its relevant source, test, and
configuration files are unchanged.

Run TypeScript and any required broad checks once before handing off the
completed slice. Run the default full Vitest suite only for changes whose row in
the verification matrix requires it, and run `zerro-core:package-check` only
when the package or dependency boundary changes.

Run ESLint and Prettier against touched files during the loop. Prefer Vitest's
compact agent output: `--reporter=agent --silent=passed-only`.

## Verification health

The 2026-07-13 audit found load-sensitive parallel tests, formatting and ESLint
drift, and an untrustworthy Knip configuration. Closed on 2026-07-14:

- package declaration compilation runs only as the explicit
  `zerro-core:package-check` gate;
- the import-heavy session parity test loads its dependencies before the test
  timeout starts;
- the default parallel suite is reproducibly green without a timeout increase;
- ESLint enforces zero warnings and Core formatting is clean;
- Knip starts from the real app, worker, and package-consumer entrypoints.

Knip output is evidence for an audit, not automatic deletion authority.

## Completion gate

Before calling the refactor complete:

1. focused tests, TypeScript, default parallel Vitest, package consumer,
   formatting, and dependency checks are reproducibly green;
2. a manual smoke covers initial load, budget/goal edit, transaction edit,
   reload with pending state, and explicit sync;
3. production has no legacy model dependency replaced by the Core Redux API;
4. remaining presentation/app-service compatibility has an owner and exit
   condition.

Latest manual checkpoint (2026-07-12): demo load, transaction edit, pending
outbox, and reload persistence passed without console errors. Explicit sync and
budget/goal edit remain open.

## Commands

```bash
pnpm exec vitest run path/to/test.ts
pnpm exec tsc --noEmit
pnpm exec vitest run
pnpm zerro-core:package-check
pnpm exec eslint src/zerro-core
pnpm exec prettier --check "src/zerro-core/**/*.{ts,tsx,json,md}"
git diff --check
```

State which layer protects the changed contract; the existence of a harness is
not evidence that every path uses it.
