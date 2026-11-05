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
  redo preservation across pulls;
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

Paths are relative to `src/zerro-core/` unless they start with `src/`.

- `support/testing/zenmoneyTestData.ts` — normalized stores and entities;
- `support/testing/zerroTestData.ts` — Zerro projection shapes;
- `support/testing/demoState.ts` — pinned public demo snapshot;
- `src/store/testing.ts` — minimal Redux test state;
- `support/testing/stableJson.ts` — deterministic safe comparison.

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
| Package/dependency boundary | Boundary tests                                   |

## Agent verification discipline

During implementation, run only the focused tests that protect the changed
contract. Do not repeat a successful check while its relevant source, test, and
configuration files are unchanged.

Run `pnpm verify` once before handing off a completed code slice. It includes
TypeScript and the correctly scoped full unit suite. The matrix still determines
which focused regressions and manual evidence are required in addition to that
baseline. Documentation-only changes may use the narrower route in
`docs/agents/verification.md`.

Run ESLint and Prettier against touched files during the loop. Prefer Vitest's
compact agent output: `--reporter=agent --silent=passed-only`.

## Manual smoke

Automated checks do not cover the load-to-sync path, so one manual smoke does:
initial load, budget/goal edit, transaction edit, reload with pending state,
explicit sync with a pending outbox, undo/redo, and logout history reset. Record
what was exercised and whether the server was real or simulated; a previous
smoke is not evidence for a new change.

Re-run it when replica persistence, the command shape, or the sync transport
changes. Routine domain work does not need it.

Knip output is evidence for an audit, not automatic deletion authority.

## Commands

```bash
pnpm exec vitest run path/to/test.ts --reporter=agent --silent=passed-only
pnpm test:related path/to/source.ts
pnpm verify
```

State which layer protects the changed contract; the existence of a harness is
not evidence that every path uses it.
