# Zerro Core testing policy

Zerro Core tests protect domain rules, dependency boundaries, and migration
parity. They should not make every thin helper expensive to change.

## Test layers

### 1. Focused unit and contract tests

Use for:

- patch immutability, deletion, merge, and replay ordering;
- command validation, deterministic ids/timestamps, receipts, and resulting
  state;
- materializer intent/applied contracts and cross-entity effects;
- transaction classification and intent-only command behavior;
- future materializer balance effects and account cascades;
- hidden-data parsing and write semantics;
- envelope, budget, FX, activity, month-total, and goal edge cases;
- engine append, replay-prefix, undo/redo, reload, and redo-tail behavior;
- package and dependency boundaries.

For command changes, compare the state after applying the patch. Patch shape
alone is insufficient when legacy and Core can reach the same state differently.

### 2. Deterministic demo regressions

Use public demo data for representative read graphs, session behavior, Redux
selector parity, and facade contracts:

```ts
makeDemoDiff({ now, until, scale })
makeDemoStore({ now, until, scale })
```

Pin time and size. Add a new scenario only when it protects a distinct domain
shape rather than another arbitrary fixture.

### 3. Redux adapter invalidation tests

Parity does not prove memoization dependencies. When switching or rewiring a
selector, test both:

- unrelated slices keep the same result reference;
- relevant slices recompute the intended downstream nodes.

Do not replace granular selectors with a selector over the whole `current`
snapshot.

## Legacy-parity exit policy

Legacy comparisons are migration bridges, not permanent specifications. Every
test that imports a legacy selector or compares against captured legacy output
must carry an explicit `LEGACY-PARITY BRIDGE` comment naming its exit condition.

Remove a comparison when the matching legacy read has no production consumers
and is deleted. Before removal, preserve only scenarios that protect a named
Core contract by rewriting them with direct expected values, invariants, or
safe summaries. Delete comparisons that merely prove two obsolete
implementations agree.

## Avoid low-value tests

Do not test direct map access by itself:

```ts
expect(getCompanies(data)).toBe(data.company)
```

Keep such a test only if the helper owns a meaningful contract such as missing
value normalization, filtering, id/date conversion, or stable ordering.

## Builders

Shared builders are intentionally permissive and test-only:

- `src/zerro-core/testing/zenmoneyTestData.ts` for normalized stores/entities;
- `src/zerro-core/testing/zerroTestData.ts` for Zerro projection shapes;
- `src/zerro-core/testing/demoState.ts` for the pinned public demo snapshot;
- `src/zerro-core/testing/stableJson.ts` for deterministic safe comparison.

Keep important scenario fields visible in each test. Avoid large helpers that
hide the behavior being asserted.

Production factories live beside their domain entities and must not become
permissive test builders.

## Verification by change type

| Change                       | Minimum verification                              |
| ---------------------------- | ------------------------------------------------- |
| Pure helper or one projector | Focused unit tests + TypeScript                   |
| Command compiler             | Compiler tests + resulting-state test             |
| Selector wiring              | Parity + relevant/unrelated invalidation tests    |
| Facade/read graph            | Session tests + deterministic demo parity         |
| Materializer or patch apply  | Focused tests + reducer/engine tests + full suite |
| Replica/sync                 | Reload, undo/redo, rebase, and full suite         |
| Package boundary             | Boundary tests + external consumer type compile   |

## Refactor completion gate

The green public suite is an intermediate verification checkpoint, not by
itself proof that the app has completed the Core cutover. Before declaring the
refactor complete, require all of the following:

1. Full deterministic suite, TypeScript, package consumer, formatting, and
   dependency-boundary checks are green.
2. A manual browser smoke covers initial load/sync, one budget or goal edit, one
   transaction edit, reload with pending state, and explicit sync.
3. Production-source audit finds no remaining legacy model API that the Core
   Redux surface is intended to replace. Remaining presentation or app-service
   helpers must have an explicit ownership decision.
4. Legacy-parity bridges are either removed with their legacy implementation or
   retain a concrete exit condition.

Latest manual checkpoint (2026-07-12): the demo browser flow loaded, navigated
to transactions, edited a comment, produced one pending outbox item, and kept
the edit plus outbox after reload without console errors. Explicit remote sync
and a budget/goal edit were not exercised.

## Commands

Focused:

```bash
pnpm exec vitest run path/to/test.ts
pnpm exec tsc --noEmit
pnpm zerro-core:package-check
```

Shared boundary:

```bash
pnpm exec vitest run
pnpm exec tsc --noEmit
```

Do not treat the existence of a harness as evidence that every layer uses it.
State explicitly which unit, demo, adapter, or private checks protect the
changed contract.
