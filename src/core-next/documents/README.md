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
- [roadmap.md](./roadmap.md): short map of the active work tracks and suggested
  next agent starting points.
- [testing.md](./testing.md): testing policy and fixture strategy.
- [private-fixtures.md](./private-fixtures.md): private fixture export,
  storage, privacy, and comparison workflow.
- [open-questions.md](./open-questions.md): decisions that need product or
  architecture input before they become implicit defaults.
- [compatibility.md](./compatibility.md): temporary bridges and their exit
  criteria.

## What We Are Building

`core-next` is the staged extraction of Zerro domain logic into a
storage-agnostic module.

The target shape is:

```txt
state + command => patch
state => derived view
base + patches => current
```

When a command compiler must report a generated id back to the caller, it can
return `TCompiled<TReceipt>`: `patch` remains the replay source of truth, while
`receipt` is ephemeral caller metadata and is not replayed.

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

See [roadmap.md](./roadmap.md) for the current track map. The short version:

1. Test and fixture infrastructure: deterministic Core Next demo data and parity tests.
2. ZenMoney entity layer: accounts, merchants, tags, transactions, then derived
   reads.
3. Zerro write layer: hidden-data writers, service account, envelope/budget/goal
   commands.
4. Engine and adapter integration: explicit selectors, outbox engine, gradual UI
   connection.
