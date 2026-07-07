# Core Next Roadmap

Date: 2026-07-07
Purpose: short handoff map for choosing the next Core Next task.

## Current Position

Core Next already has:

- pure patch primitives: `applyPatch`, `applyPatchMutable`, `replay`;
- focused ZenMoney reads for users, debtors, balances, and FX inputs;
- ZenMoney command compilers for accounts, tags, merchants, and transactions;
- Zerro read projectors through envelopes, budgets, raw activity, activity, sorted activity, env metrics, month totals, goals, and goal totals;
- `createZerroSession` with lazy memoized reads;
- Redux adapter selectors that keep the projection graph explicit;
- deterministic demo-data generation and public demo parity tests;
- private fixture parity tests and shared test-data builders.

The next work is not one straight line. It is a set of related tracks. Keep each
change small, dependency-aware, and separately verifiable.

## Track A: Test And Fixture Infrastructure

Goal: make migration comparisons easy without turning every helper into a unit
test.

Implemented:

1. Make `src/demoData` deterministic by accepting explicit `now` and `until`.
2. Split demo data into a shared generator and an app-facing wrapper.
3. Add `makeDemoDiff({ now, until, scale })` and `makeDemoStore(...)` for Core Next tests.
4. Add demo-data parity tests for session/read-model outputs.
5. Keep private fixture tests opt-in and hash/safe-summary based.

Useful next tasks:

1. Add focused demo parity cases when new read models or command slices are
   migrated.
2. Add alternate public demo scenarios only when they protect a distinct domain
   shape, for example sparse history, multi-currency savings, or debt-heavy
   accounts.
3. Keep the pinned demo state small enough for ordinary vitest runs; use private
   fixtures for large-account confidence.

Do not:

- fetch test state from the network during ordinary tests;
- commit private fixtures;
- add low-value tests that only prove direct map access.

## Track B: ZenMoney Entity Layer

Goal: make ZenMoney Core feel like a small domain library instead of scattered
helpers.

Dependency order and status:

1. `primitives` - done.
2. `instruments` - done.
3. `countries` - done.
4. `companies` - done.
5. `users` - done.
6. `merchants` - mostly done: types, read selectors, production factory, patch
   command, and focused tests exist; create/delete commands can wait until a
   real command path needs them.
7. `tags` - mostly done: types, read selectors, production factory,
   create/patch commands, and focused tests exist; `archive` is part of the
   normalized tag shape. Populated tags and tag trees remain outside this
   normalized entity slice for now.
8. `accounts` - mostly done: types, read selectors, production factory,
   create/patch/delete commands, and focused tests exist. Account reads now stay
   account-only: FX-code preparation belongs in projections via
   `instrumentCodeById`. Higher-level merge/cascade behavior remains separate.
9. `budgets` - done: types, map read helper, production factory, id helper,
   set-tag-budget command compiler, and focused tests exist. Zerro envelope
   budgets remain separate.
10. `reminders` - done: types, map read helper, production factory, set/delete
    command compilers, and focused tests exist.
11. `reminderMarkers` - done: types, map read helper, production factory, and
    focused tests exist. This is the ZenMoney `reminderMarker` entity, not a
    separate "reminder maker" concept.
12. `transactions` - done: types, read selectors, production factory,
    create/mutation commands, balance effects, and focused tests exist.
13. `debtors` - done as a derived read.
14. `balances` - done as a derived read.

For each mutable entity:

1. Keep types close to the entity module when the boundary is stable.
2. Add production factories only when domain code needs real creation defaults.
3. Keep test builders in `src/core-next/testing` permissive and test-only.
4. Keep command functions pure: `data + input + ctx => patch`.
5. Verify command result by applying the patch, not only by checking patch shape.

Track B is now structurally complete for normalized ZenMoney entities:

```txt
zenmoney/budgets
zenmoney/reminders
zenmoney/reminderMarkers
```

The `zenmoney/accounts` slice has already extracted read selectors and a
production account factory, and tightened create command input so `user` is
derived from the store. The `zenmoney/merchants` and `zenmoney/tags` slices now
have the same module shape for types, reads, factories, and commands.
`zenmoney/transactions` now owns types, reads, a production factory, commands,
and balance effects.
`zenmoney/budgets`, `zenmoney/reminders`, and `zenmoney/reminderMarkers` now own
their types and direct read layers; budget and reminder command compilers cover
the existing legacy write behavior.

Recent bottom-up cleanup moved prepared FX account rows out of the account read
layer. Keep that direction: pass normalized maps plus explicit dependencies to
projectors instead of adding presentation-ready read helpers to ZenMoney entity
modules.

When extending Track B, prefer refinement work rather than adding more entity
folders: transaction creation/reminder scheduling can build on the new
`reminders` and `reminderMarkers` modules when those command paths are migrated.

Do not:

- do a big-bang move of all `6-shared/types`;
- import Redux, React, storage, API clients, or legacy selectors into ZenMoney Core;
- turn permissive test builders into production factories.

## Track C: Zerro Write Layer

Goal: move from read projectors to Zerro commands that compile normalized patches.

Recommended order:

1. Hidden-data write codecs:
   - user settings;
   - envelope meta;
   - envelope budgets;
   - goals;
   - FX rates, if needed for command work.
2. Service account write path:
   - find existing `🤖 [Zerro Data]` account;
   - create it when missing;
   - write reminders without Redux thunks.
3. First envelope command:
   - rename;
   - color/icon-ish metadata;
   - group/index;
   - visibility;
   - keep income and carry negatives;
   - account/tag/merchant entity changes where needed.
4. Budget command:
   - choose ZenMoney tag budget vs hidden env budget according to `preferZmBudgets`;
   - support empty budget clearing.
5. Goal command:
   - set/update/delete monthly goal data.

Verification should compare resulting state with the old thunk behavior whenever
legacy command behavior exists.

Do not:

- let commands import Redux selectors;
- make commands depend on heavy projections unless the projection is a real
  domain invariant;
- hide write behavior inside adapter code.

## Track D: Engine, Adapter, And UI Integration

Goal: let the app use Core Next without introducing a second source of truth.

Recommended order:

1. Keep Redux adapter selectors thin and explicit.
2. Replace legacy selector imports with `core-next/adapters/redux` imports one
   consumer at a time.
3. Add `createZerroEngine` only after command patch compilation is useful.
4. Model `base + outbox + outboxHead + inbox + current`.
5. Connect one safe read model or command at a time.

Do not:

- introduce a single `current => createReadModel(current)` selector;
- switch many UI consumers at once;
- create a parallel reactive store beside Redux for the current app.

## Suggested Next Agent Starting Points

If the next agent should continue cleanup:

1. Start with Track A and make demo data deterministic.
2. Add a small demo parity test for one already-migrated read model.

If the next agent should continue domain migration:

1. Review whether any legacy imports can now switch from `5-entities` to
   `core-next/zenmoney` one consumer at a time.
2. Consider the next command path that needs reminder scheduling or transaction
   creation.
3. Keep the change limited to one command/read integration and its tests.

If the next agent should unlock Zerro commands:

1. Start with Track C, hidden-data write codecs.
2. Implement one simple hidden-data writer and compare the resulting state with
   the existing legacy write path.

The most conservative next step is a small Track D integration cleanup, because
the normalized ZenMoney entity layer now has type/read/factory coverage through
reminder markers without depending on a full Zerro command pipeline.

## Verification Defaults

For narrow code changes:

```bash
./node_modules/vitest/vitest.mjs run src/core-next/zenmoney src/core-next/zerro
pnpm lint
```

For private fixture parity:

```bash
PRIVATE_FIXTURE=private-fixtures/zerro-private-fixture-my-large-account-20260706-0026.json node --max-old-space-size=4096 ./node_modules/vitest/vitest.mjs run src/core-next/zerro/read.private-fixture.test.ts src/core-next/adapters/redux/selectors.private-fixture.test.ts
```

Only run private fixture commands when the local fixture exists.
