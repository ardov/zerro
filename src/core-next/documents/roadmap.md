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
- deterministic demo-data generation under `core-next/demo` and public demo
  parity tests;
- package-safe tag icon metadata under `core-next/tag-icons`;
- private fixture parity tests and shared test-data builders.

The next work is not one straight line. It is a set of related tracks. Keep each
change small, dependency-aware, and separately verifiable.

Priority decision (2026-07-09): Track D consumer switching comes first. Core
Next has a large parallel implementation but zero production consumers, which
is the biggest project risk: parity tests only protect a static snapshot, and
every week without a real consumer grows the eventual cutover. Prefer switching
one real read consumer over adding new domain slices. Start with budgets
(`budgetModel.get` has 3 consumers), then envelopes.

## Track A: Test And Fixture Infrastructure

Goal: make migration comparisons easy without turning every helper into a unit
test.

Implemented:

1. Make demo data deterministic by accepting explicit `now` and `until`.
2. Move demo data ownership to `src/core-next/demo` and keep `src/demoData` as a
   thin compatibility wrapper.
3. Add `makeDemoDiff({ now, until, scale })` and `makeDemoStore(...)` for Core Next tests.
4. Add demo-data parity tests for session/read-model outputs.
5. Keep private fixture tests opt-in and hash/safe-summary based.
6. Add `src/core-next/tag-icons` as package-safe ZenMoney tag icon metadata.

Useful next tasks:

1. Add focused demo parity cases when new read models or command slices are
   migrated.
2. Add alternate public demo scenarios only when they protect a distinct domain
   shape, for example sparse history, multi-currency savings, or debt-heavy
   accounts.
3. Keep the pinned demo state small enough for ordinary vitest runs; use private
   fixtures for large-account confidence.
4. Decide whether `core-next/demo` should expose `createDemoZerroEngine`.
5. Decide whether Core Next should own SVG icon assets or only emoji metadata
   plus adapter-provided SVG URLs.

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
   normalized tag shape. Core now owns the pure tag structure (names, unique
   names, children, and colors); the Redux adapter owns the localized `null`
   sentinel and SVG/emoji symbols. Tag-tree UI remains an adapter concern.
8. `accounts` - mostly done: types, read selectors, production factory,
   create/patch/delete commands, and focused tests exist. Account reads now stay
   account-only: FX-code preparation and Zerro-specific in-budget/data-account
   conventions belong in Zerro projectors via explicit dependencies.
   Higher-level merge/cascade behavior remains separate.
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
4. Keep command functions pure: usually `data + input + ctx => patch`.
5. Verify command result by applying the patch, not only by checking patch shape.
6. When a compiler must expose a generated id, return `TCompiled<TReceipt>`:
   keep the normalized `patch` replayable and put caller-only metadata in
   `receipt`.

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

Zerro-specific account conventions also stay out of the ZenMoney account entity
layer. The `🤖 [Zerro Data]` account name and pinned `📍` title rule live under
`core-next/zerro/accounts`; ZenMoney account reads expose only normalized
account facts.

When extending Track B, prefer refinement work rather than adding more entity
folders: transaction creation/reminder scheduling can build on the new
`reminders` and `reminderMarkers` modules when those command paths are migrated.

Do not:

- do a big-bang move of all `6-shared/types`;
- import Redux, React, storage, API clients, or legacy selectors into ZenMoney Core;
- turn permissive test builders into production factories.

## Track C: Zerro Write Layer

Goal: move from read projectors to Zerro commands that compile normalized patches.

Implemented:

1. Service account read/create compiler:
   - find existing `🤖 [Zerro Data]` account;
   - create it when missing using the root user's currency;
   - return `TCompiled<{ accountId }>` so hidden-data writes can use the id
     without treating it as replay state.
2. Generic hidden-data write codecs:
   - set/reset simple reminder-backed payloads;
   - set/reset monthly reminder-backed payloads;
   - delete empty monthly payloads like the legacy hidden-store factory.
3. User settings command compiler:
   - patch stored settings over current hidden data;
   - remove `undefined` keys like the legacy thunk;
   - reset settings through simple hidden-data deletion.
4. Envelope meta command compiler:
   - patch one or more meta records over current hidden data;
   - write the resulting meta map through simple hidden data.
5. Env budget command compiler:
   - group updates by month and merge them over current hidden budgets;
   - remove zero-valued envelope budgets;
   - write each month through monthly hidden data without duplicating service
     account creation in multi-month batches.
6. Goal command compiler:
   - normalize goal drafts like the legacy `makeGoal`;
   - write monthly goal payloads through monthly hidden data;
   - remove the nearest future `null` blocker when setting a new real goal.
7. Envelope command compiler:
   - `compilePatchEnvelope` maps legacy envelope drafts to tag/account/merchant
     patches plus metadata patches;
   - entity-owned fields now cover `originalName`, tag `colorHex`, and tag
     parent changes;
   - `compilePatchEnvelopeMetadata` handles the meta-owned fields of legacy
     `patchEnvelope`;
   - adapters/orchestration are still outside this slice.
8. Budget command compiler:
   - `compileSetBudget` chooses ZenMoney tag budgets vs hidden env budgets via
     `preferZmBudgets`;
   - tag envelope `tag#null` maps to ZenMoney `tag: null`;
   - mixed updates compile into a single normalized patch.

Recommended order:

1. Goal orchestration:
   - wire UI-level goal commands to `compileSetGoal`;
   - keep tracking and dispatch outside core.
2. Command execution wiring:
   - wrap domain compilers in app-facing methods;
   - keep tracking, Redux dispatch, and persistence outside core.

Verification should compare resulting state with the old thunk behavior whenever
legacy command behavior exists.

Do not:

- let commands import Redux selectors;
- make commands depend on heavy projections unless the projection is a real
  domain invariant;
- hide write behavior inside adapter code.

## Track D: Engine, Adapter, And UI Integration

Goal: let the app use Core Next without introducing a second source of truth.

Progress:

- 2026-07-09: `budgetModel.get` consumers in `5-entities/envBalances`
  (monthList, envMetrics) now read `selectCoreBudgets`. The export feature's
  `exportPrivateFixture` intentionally keeps `budgetModel.get` because it
  snapshots legacy outputs for parity fixtures.
- Hidden-data reads take `THiddenDataSource` (`Pick<TDataStore, 'reminder'>`),
  and the budget/hidden-data adapter selectors depend on the reminder/budget
  slices instead of the whole `current`, so unrelated data changes keep them
  cached. `selectors.budgets.test.ts` covers parity and invalidation.
- 2026-07-09: envelope read consumers switched to core selectors:
  `envBalances` activity/sortedActivity/envMetrics use
  `selectCoreKeepingEnvelopeIds`/`selectCoreEnvelopes`, and the Budgets page
  (EnvelopeTable, Group, envRenderInfo, CommentWidget) uses
  `selectCoreEnvelopes`/`selectCoreEnvelopeStructure`. Account reads take
  `TAccountSource` (`Pick<TDataStore, 'account'>`); compiled envelopes,
  in-budget ids, and current funds depend on the account slice.
  `selectors.envelopes.test.ts` covers parity and invalidation. Verified live
  in demo mode: budget set, envelope comment round-trip, totals recompute.
  Envelope write thunks in `4-features/envelope` still read legacy selectors;
  they migrate together with command compilers.
- 2026-07-09: goal read consumers switched to `selectCoreGoals` /
  `selectCoreGoalTotals` (GoalsProgress, MonthInfo, envRenderInfo, Row,
  useQuickActions, GoalPopover, EnvelopePreview), and the remaining
  `envelopeModel.useEnvelopes()` hook consumers (10 components) now read
  `selectCoreEnvelopes` — the first envelope wave only caught direct selector
  usage. Write paths (`goalModel.set`, `fillGoals` thunk, `goalModel.toWords`
  formatting) stay legacy until command compilers take over.
  `selectors.goals.test.ts` seeds a goal through `compileSetGoal` and covers
  parity, a whole-graph invalidation sentinel, and recompute-on-change.
- 2026-07-09: the whole `envBalances` UI read surface switched to core:
  ~21 components read `selectCoreEnvMetrics`, `selectCoreMonthTotals`,
  `selectCoreMonthList`, `selectCoreActivity`, `selectCoreSortedActivity`,
  and `selectCoreRawActivity`. All `balances.use*`, `envelopeModel.use*`, and
  `goalModel.use*` hooks are deleted (zero consumers); the underlying legacy
  selectors are marked `@deprecated` and stay only as the parity reference and
  for the not-yet-migrated write thunks (`setTotalBudget`, `copyPrevMonth`,
  `fixOverspends`, `startFresh`, `moveMoney`, `fillGoals`, envelope thunks)
  plus `exportPrivateFixture` and the legacy goal chain internals.
- Known granularity limit: all hidden-data types share the reminder slice, so
  a hidden write of one type recomputes reads of the others (legacy avoided
  this with a shallowEqual reminder-filter selector). Rare in practice;
  refine only if it shows up in profiles.
- 2026-07-09, reactivity decision: stay with passive core + per-runtime
  memoization for now. The adapter entrypoint (`adapters/redux/index.ts`)
  exports only selectors with real app consumers; internal memoization nodes
  are module-private, test-only selectors stay in `./selectors`. A declarative
  projection-graph definition (one graph spec, derived session/redux runtimes)
  is the fallback if graph duplication keeps causing invalidation bugs. A
  reactive core that owns recomputation and notifies subscribers is deferred
  until the engine owns replica state — doing it while Redux owns data would
  create a second source of truth.
- 2026-07-09: transaction history in the Redux graph now comes from the Core
  `TTransactionSource` read boundary, not `trModel.getTransactionsHistory`.
  The internal history selector feeds debtors, month list, raw activity,
  history start, and balances while depending only on the transaction slice.
  `DebtorList` is the first direct UI consumer of the public
  `selectCoreDebtors`, and `WidgetAccHistory` reads the public
  `selectCoreBalancesByDate`. Transaction List, preview, context menu and bulk
  edit now read the Core transaction map and Core-compatible sorted IDs;
  filtering stays UI-owned. Stats cashflow reads Core history and history start
  and uses the Core transaction classifier. `selectors.transactions.test.ts`
  covers parity, unrelated-slice caching, and recomputation when transactions
  change.
- 2026-07-10: Core owns the pure tag-structure projection. The Redux adapter
  decorates it with app-only i18n and icon assets, and the compiled-envelope
  selector now reads that adapter projection directly rather than
  `tagModel.getPopulatedTags`. `selectors.tags.test.ts` protects parity and
  tag-slice invalidation; `createZerroSession` deliberately keeps its explicit
  prepared-tag dependency until it can accept Core structure directly.
- 2026-07-10: remaining tag/transaction read tails switched:
  `selectCorePopulatedTags` is public and feeds TagChip, TagSelect, Review
  cards, transaction list components, and CSV export; Review `getFacts` reads
  core transaction history; `useBalances` aggregates over
  `selectCoreBalancesByDate`. Orphaned hooks deleted (`trModel.useTransactions`
  family, `tagModel.usePopulatedTags`, `debtorModel.useDebtors`); legacy read
  selectors with core replacements are `@deprecated`. `tagModel.getTagsTree`
  and `trModel.useTrTypeGetter` remain legacy until their consumers migrate.
  Write thunks (`mergeAccounts` and friends) still read legacy selectors.
- 2026-07-10: production core is self-contained. `core-next/shared` holds
  internal copies of keys/date/money helpers and utility types;
  `zenmoney/colors` owns the color codec and the frozen generated-color
  palette; `zenmoney/store` owns `TDataStore` and the normalized patch shapes
  (`6-shared/types` re-exports them as a shim). The boundary test forbids any
  `6-shared` import from production core.
- 2026-07-10: the first budget write consumer now uses Core Next too:
  `budgetModel.set` compiles its mixed tag/envelope updates through
  `compileSetBudget` and applies the single normalized patch through the
  existing Redux `applyClientPatch` action. Redux still owns persistence and
  sync; this is not an outbox-engine cutover. `setBudget.test.ts` protects the
  mixed-update bridge and empty-update no-op.
- 2026-07-10: `goalModel.set` now compiles through `compileSetGoal` and applies
  the resulting normalized patch through Redux. Core owns goal normalization
  and future-blocker removal; the thunk keeps only event tracking. The bridge
  test covers both the nearest-blocker removal and the legacy delete event.
- 2026-07-10: the central `envelopeModel.patchEnvelope` writer now compiles
  tag/account/merchant and metadata changes through `compilePatchEnvelope`,
  using `selectCoreEnvelopes` as its explicit prepared input. Its callers,
  including envelope creation and group operations, keep their existing Redux
  entrypoints. `patchEnvelope.test.ts` covers a mixed patch and the synchronous
  create-tag-then-patch path.
- 2026-07-10: `setTotalBudget` now reads `selectCoreEnvMetrics` before routing
  adjusted own-budget updates into the Core-backed `budgetModel.set`. This
  covers fill-goals, fix-overspends, and start-fresh without changing their
  orchestration. Its focused test protects child-budget FX adjustment.

- 2026-07-10: `moveMoney` now reads `selectCoreEnvMetrics` and preserves
the existing app-level FX conversion before dispatching to `budgetModel.set`.
Its focused test covers a cross-currency destination budget.

- 2026-07-10: `copyPreviousBudget` now reads `selectCoreEnvMetrics` and keeps
  its previous-month comparison plus Core-backed `setBudget` write unchanged.
  Its focused test covers copying a changed own budget.

- 2026-07-10: `startFresh` now reads `selectCoreEnvMetrics` independently for
  each reset/cleanup phase, preserving state-sensitive sequencing after every
  dispatch. Its focused test covers child reset, parent reset, and future-budget
  cleanup.

- 2026-07-10: `fixOverspends` now reads `selectCoreEnvMetrics` separately for
  child and parent passes. Its focused test covers both overspend calculations
  before they route through `setTotalBudget`.

- 2026-07-10: `fillGoals` now reads `selectCoreGoals`, keeping the existing
  filters for fulfilled and endless target-balance goals before dispatching
  through `setTotalBudget`. Its focused test protects those filters.

Next architecture slice: design and land a Redux-backed replica adapter around
the pure engine. Redux must become the sole owner of `base`, `outbox`,
`outboxHead`, `inbox`, and replayed `current`; do not instantiate a parallel
in-memory engine from thunks.

- 2026-07-10: the command funnel exists. `adapters/redux/commands.ts` defines
  the serializable, versioned `TAppCommand` envelope (`zerro.budget.set`,
  `zerro.goal.set`, `zerro.envelope.patch`, `legacy.patch`) with
  `compileAppCommand` as the registry and `executeCommand` as the single write
  thunk; `setBudget`/`setGoal`/`patchEnvelope` are one-line command creators.
  Remaining legacy writes flow through `applyLegacyPatch`
  (`adapters/redux/legacyPatch.ts`) — deliberately selector-free, because
  entity thunks import it while the selector graph imports entity barrels;
  the replica step points both entries at the same outbox slice action.
  Known funnel bypasses: hidden-store `dataAccount`/`setReminder` internals
  (die with hidden-store) and the `window.zerro` dev helper. Cycle-hardening
  landed alongside: account selectors take the data-account constant from
  Core, `dataAccount` reads the account slice directly, and the hidden-store
  barrel exports types first.
  Next: replica slice — replace `data.diff` with `outbox`/`outboxHead`,
  rebase `applyServerPatch`, add `selectPendingDiff` for sync.

Recommended order:

1. Keep Redux adapter selectors thin and explicit.
2. Replace legacy selector imports with `core-next/adapters/redux` imports one
   consumer at a time.
3. `createZerroEngine` exists as a pure outbox/current primitive:
   - stores `base`, `outbox`, `outboxHead`, optional `inbox`;
   - `execute(command, compiler)` compiles against current state and stores
     only command + patch;
   - `executeCompiled(command, patch)` stores command + patch and drops redo
     tail;
   - `getCurrent()` replays only the applied outbox prefix.
4. Add Redux adapter command execution around the pure engine primitive.
5. Connect one safe read model or command at a time.

Do not:

- introduce a single `current => createReadModel(current)` selector;
- switch many UI consumers at once;
- create a parallel reactive store beside Redux for the current app.

## Suggested Next Agent Starting Points

If the next agent should continue cleanup:

1. Review `documents/open-questions.md` and `documents/compatibility.md`.
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

The default next step is a Track D consumer switch: point one legacy read
consumer at `core-next/adapters/redux`, keep the legacy selector as a fallback,
and add an invalidation test for the switched chain (parity tests do not cover
memoization dependencies). Budgets first, envelopes second.

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
