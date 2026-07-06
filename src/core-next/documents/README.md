# Core Next Notes

This folder is the documentation home for `src/core-next`.

Keep Core Next architecture, handoff state, testing policy, fixture workflows,
and migration decisions here so they travel with the module if `core-next` later
moves into `src/domain` or a separate package.

## Documents

- [architecture.md](./architecture.md): target architecture, module boundaries,
  staged migration plan, and invariants.
- [handoff.md](./handoff.md): current implementation state, verified commands,
  guardrails, and recommended next steps.
- [testing.md](./testing.md): testing policy and fixture strategy.
- [private-fixtures.md](./private-fixtures.md): private fixture export,
  storage, privacy, and comparison workflow.

## What We Are Building

`core-next` is the staged extraction of Zerro domain logic into a
storage-agnostic module.

The target shape is:

```txt
state + command => patch
state => derived view
base + patches => current
```

Redux, React, IndexedDB, ZenMoney API calls, localization, and persistence stay
outside the core module behind adapters.

## Current Testing Direction

Use three complementary layers:

1. Focused unit tests for domain rules, validations, patch compilation,
   immutability, date behavior, FX behavior, and read-model edge cases.
2. Deterministic demo-data regression tests for migrated read models and session
   behavior.
3. Private or anonymized fixture parity tests for large real-world accounts,
   using safe hashes or summaries instead of deep object diffs.

See [testing.md](./testing.md) for the detailed testing policy.

## Near-Term Plan

1. Keep small local builders for focused unit tests, then extract repeated
   builders into `src/core-next/testing` when duplication becomes distracting.
2. Make demo data deterministic by accepting explicit `now` and `until` inputs.
3. Add a core-owned demo fixture helper that can produce either a `TDiff` or a
   normalized `TDataStore`.
4. Use demo fixtures for parity tests between legacy selectors, Redux adapters,
   and `createZerroSession`.
5. Prune tests that only assert direct map access or identity wrappers unless
   they capture an intentional contract such as missing-value behavior.
