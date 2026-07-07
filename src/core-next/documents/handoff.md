# Core Next handoff

Date: 2026-07-07
Branch: `core-next`

## Current state

Core Next documentation lives next to the module:

- `src/core-next/documents/README.md`
- `src/core-next/documents/architecture.md`
- `src/core-next/documents/roadmap.md`
- `src/core-next/documents/testing.md`
- `src/core-next/documents/private-fixtures.md`

The current branch has these recent commits:

```txt
0787e7ef update acc type
c511dd69 Add archive property to tag and update all layers from the bottom up to accounts in core-next
a408d86c format md
cd14b5d4 Shape core-next transaction entity layer
31ed00c5 Shape core-next tag entity layer
9b3ea3d4 Shape core-next merchant entity layer
```

Recent user changes after the transaction slice:

- `a408d86c` is documentation formatting only. It reformats
  `src/core-next/documents/architecture.md` and `src/core-next/zenmoney/README.md`
  without changing runtime behavior.
- `c511dd69` adds `archive` to `TTag` and to tag factories/test builders. This
  field is now part of the normalized ZenMoney tag shape, so new tag builders
  must default it explicitly.
- `c511dd69` also reshapes low-level ZenMoney reads from instruments through
  accounts: direct entity reads now generally expose maps such as `getTags`,
  `getMerchants`, `getCompanies`, `getCountries`, and `getInstruments`, while
  command code indexes those maps when it needs an existence check. Avoid
  reintroducing one-off nullable `getX(id)` helpers unless there is a repeated
  domain use case.
- Account reads were narrowed to account facts: `getAccounts`,
  `getAccountList`, `getDebtAccountId`, and `getAccStartBalance`. FX-code
  preparation moved out of account reads. Projections that need FX codes should
  accept `instrumentCodeById` explicitly.
- Zerro-specific account conventions live under `core-next/zerro/accounts`:
  `getZerroDataAccountId`, `isZerroInBudgetAccount`,
  `getZerroInBudgetAccountIds`, and `getZerroSavingAccounts`. This is where the
  `🤖 [Zerro Data]` account name and pinned `📍` account title rules belong.
- `buildCurrentFunds` now accepts `{ accounts, inBudgetIds, instrumentCodeById }`
  instead of pre-populated account rows. The Redux adapter memoizes
  `selectCoreInBudgetAccountIds` with `shallowEqual`, so transaction-heavy
  projections are not invalidated by ordinary account balance changes.
- `buildBalances` now accepts normalized `ById<TAccount>` plus
  `instrumentCodeById`, instead of a pre-shaped balance account map. This keeps
  FX resolution local to the balance projector.
- `createZerroSession` mirrors the same dependency graph: it memoizes
  `inBudgetAccountIds`, passes raw account maps to `buildCurrentFunds` and
  `buildBalances`, and uses `getInstCodeMap`.
- `0787e7ef` adds `balanceCorrectionType: 'request' | null` to `TAccount` and
  defaults it in both legacy and core account factories. Account draft
  `startDate` can now be `null` as well as a date draft.

This run adds the first Track A demo-data harness:

- `src/core-next/demo` now owns deterministic demo generation with explicit
  `now`, `until`, and `scale` options. The old `src/demoData` entrypoint remains
  as a thin compatibility wrapper.
- demo transactions now have stable ids built from source prefix, date, and
  sequence index; they no longer depend on the legacy transaction factory or
  implicit current date.
- demo account, tag, and merchant creation uses the migrated Core Next factories
  instead of `5-entities` factories.
- `makeDemoStore(options)` builds a normalized `TDataStore` from the same demo
  generator for Core Next tests.
- `src/core-next/testing/demoState.ts` exposes the pinned public demo test state
  and RootState wrapper used by parity tests.
- `src/core-next/testing/stableJson.ts` provides deterministic JSON hashing for
  public parity tests.
- `src/core-next/demo/index.test.ts` covers deterministic generation and
  normalized store construction; `src/demoData/index.test.ts` verifies the
  compatibility wrapper.
- `src/core-next/facade/createZerroSession.demo.test.ts` compares session reads
  against the current Core Redux adapter selectors on the pinned public demo
  store.
- `src/core-next/testing/zenmoneyTestData.ts` now defaults
  `balanceCorrectionType: null` so the account builder matches the current
  account shape.

Recent Track B work in `zenmoney/merchants`:

- merchant types now live under `src/core-next/zenmoney/merchants/types.ts`;
- `getMerchants` is exposed from `src/core-next/zenmoney/merchants/read.ts` as
  the normalized merchant map; command code indexes that map for existence
  checks;
- `makeMerchant` is a production factory with deterministic `now` and `uuid`
  dependencies;
- `compilePatchMerchant` now uses the merchant read layer and exports the local
  `TMerchantPatch` type instead of the longer temporary name;
- merchant tests cover factory defaults and patch behavior.

This run also adds Track B work in `zenmoney/tags`:

- tag types now live under `src/core-next/zenmoney/tags/types.ts`, and
  `6-shared/types` re-exports them like the other migrated ZenMoney entities;
- `getTags` is exposed from `src/core-next/zenmoney/tags/read.ts` as the
  normalized tag map; command code indexes that map for existence checks;
- `makeTag` is a production factory for ordinary tags with deterministic `now`
  and `uuid` dependencies;
- `compileCreateTag` and `compilePatchTag` now use local `TTagDraft` and
  `TTagPatch` names, plus the tag read/factory layers;
- populated tags, tag trees, and localized `nullTag` remain outside this
  normalized ZenMoney entity slice for now.
- Zerro envelope projections now create a Core-owned, non-localized
  uncategorized `tag#null` envelope when adapter-provided populated tags do not
  include one. This preserves calculations for transactions without categories
  and ZenMoney budgets with `tag: null` without moving i18n or legacy
  `nullTag` creation into the ZenMoney tag entity layer.

This run also adds Track B work in `zenmoney/transactions`:

- transaction types now live under
  `src/core-next/zenmoney/transactions/types.ts`, and `6-shared/types`
  re-exports them like the other migrated ZenMoney entities;
- transaction reads now expose `getTransactions`, `getTransaction`,
  `getTransactionsHistory`, and deletion/type helpers;
- `createZerroSession` now imports `getTransactionsHistory` from the transaction
  read layer instead of keeping a private copy;
- transaction commands now use local `TTransactionPatch` and the transaction
  read layer;
- transaction balance effects now use account/transaction read helpers instead
  of direct store map access;
- `makeTransaction` is now the production factory for transaction creation
  defaults;
- `compileCreateTransaction` derives the root user, creates the transaction,
  applies account balance effects, and returns the new transaction id with the
  normalized patch.

This run completes the remaining normalized Track B entities:

- `src/core-next/zenmoney/budgets` now owns `TBudget`, `TZmBudget`,
  `TBudgetId`, `globalBudgetTagId`, `getTagBudgets`, `toBudgetId`,
  `getTagBudgetId`, `makeTagBudget`, and `compileSetTagBudget`;
- Zerro hidden envelope budgets remain under `core-next/zerro/budgets`; the
  ZenMoney budget module is only for tag budgets;
- `makeTagBudget` intentionally preserves the legacy lock defaults where income
  and outcome locks default to `true`;
- `compileSetTagBudget` derives the root user, keeps existing budget fields
  when updating, and emits normalized `budget` patches;
- `src/core-next/zenmoney/reminders` now owns `TReminder`, `TZmReminder`,
  `getReminders`, `makeReminder`, `compileSetReminder`, and
  `compileDeleteReminder`;
- `compileDeleteReminder` returns an empty patch for missing reminders, matching
  the old thunk's no-op dispatch behavior, but still requires a root user like
  the legacy deletion path;
- `src/core-next/zenmoney/reminderMarkers` now owns `TReminderMarker`,
  `TZmReminderMarker`, `getReminderMarkers`, and `makeReminderMarker`;
- no reminder-marker command was added because there is no migrated legacy
  marker write path in this slice;
- `6-shared/types` now re-exports these three entities from `core-next`, and
  `transactions` imports `TReminderMarkerId` from the marker module instead of
  defining it locally;
- `createZerroSession` and the Redux adapter read ZenMoney tag budgets through
  `getTagBudgets(data)` instead of direct `data.budget` or legacy selectors.

This run starts Track C, the Zerro write layer:

- `src/core-next/zerro/accounts/commands.ts` adds
  `compileEnsureZerroDataAccount`, a pure compiler that returns
  `TCompiled<{ accountId }>` with either the existing `🤖 [Zerro Data]` account
  id or an account creation patch using the root user's currency;
- `src/core-next/zerro/hidden-data/write.ts` adds generic reminder-backed hidden
  data write codecs: `compileSetSimpleHiddenData`,
  `compileResetSimpleHiddenData`, `compileSetMonthlyHiddenData`, and
  `compileResetMonthlyHiddenData`;
- simple hidden data writes update or create a reminder with the legacy storage
  shape: data account as both income/outcome account, `income: 1`, dates
  `2020-01-01`, and JSON in `comment`;
- monthly hidden data writes validate `TISOMonth`; empty payloads compile to the
  same delete behavior as the legacy monthly hidden-store factory;
- hidden-data compilers stay pure and return normalized patches. They do not
  import Redux, storage, or legacy hidden-store thunks.
- command compilers that need to report generated ids use the compact
  `TCompiled<TReceipt>` shape: replay uses `patch`; `receipt` is caller-only
  metadata.
- `src/core-next/zerro/user-settings/commands.ts` adds
  `compilePatchUserSettings` and `compileResetUserSettings`; patching merges
  stored hidden settings with the update and removes `undefined` keys like the
  legacy thunk before writing a simple hidden-data payload.
- `src/core-next/zerro/envelope-meta/commands.ts` adds
  `compilePatchEnvelopeMeta`; it accepts one or more meta patches, merges them
  over current envelope meta, and writes the full meta map through simple
  hidden data.
- `src/core-next/zerro/budgets/commands.ts` adds `compileSetEnvBudget`; it
  groups updates by month, removes zero-valued envelope budgets, writes monthly
  hidden budget payloads, and composes multi-month patches without duplicating
  service account creation.
- the same budgets command module now adds `compileSetBudget`, which reads
  `preferZmBudgets`, routes tag envelopes to ZenMoney tag budgets when enabled,
  routes the rest to hidden env budgets, and preserves the legacy `tag#null` to
  `tag: null` mapping.
- `src/core-next/zerro/goals/commands.ts` adds `compileSetGoal`; it normalizes
  goal drafts like legacy `makeGoal`, stores monthly goal payloads, writes
  `null` blockers for deletes, and removes the nearest future blocker when a
  new real goal is set.
- `src/core-next/zerro/envelopes/commands.ts` continues the envelope write layer
  with `compilePatchEnvelope`; it maps legacy envelope drafts to ZenMoney
  tag/account/merchant patches for `originalName`, tag `colorHex`, and tag
  parent changes, plus meta-owned envelope fields through
  `compilePatchEnvelopeMetadata`.
- `src/core-next/engine/createZerroEngine.ts` adds the first pure engine
  primitive. It stores `base`, `outbox`, `outboxHead`, optional `inbox`,
  rebuilds `current` by replaying the applied outbox prefix, and exposes
  `execute(command, compiler)`, `executeCompiled(command, patch)`, `undo`, and
  `redo`. `execute` returns caller-only receipts without storing them in outbox
  entries. The engine deliberately does not own Redux persistence yet.

This cleanup hardens the package-ready API boundary:

- `src/core-next/index.ts` now exports only the root facade surface:
  constants, shared root types, engine, and facade;
- `core-next/zenmoney` and `core-next/zerro` remain implementation subpaths for
  migration/test/compatibility code, but they are not public package APIs;
- `DataEntity` now lives in `src/core-next/patch.ts`, with `6-shared/types`
  re-exporting it for legacy compatibility;
- production `core-next` no longer imports runtime values from
  `6-shared/types`;
- `TIconName` is no longer derived from `6-shared/tagIcons.json`, so normalized
  ZenMoney tag types do not depend on the app icon asset catalog;
- raw activity now parses the day from the ISO date string directly instead of
  using timezone-sensitive `new Date(transaction.date).getDate()`;
- `src/core-next/api-boundary.test.ts` protects the root facade and production
  import boundary.

This run also moves Core Next toward being the knowledge home for ZenMoney
fixtures and tag icons:

- `src/core-next/demo` owns the demo generator, reference JSON data, and
  transaction generator;
- `src/demoData` is now only a compatibility wrapper for the current app import;
- `src/core-next/tag-icons` owns the package-safe ZenMoney tag icon emoji
  catalog and lookup helpers;
- SVG URLs are still supplied by an adapter map such as the legacy
  `6-shared/tagIconsSvg.ts`, so Core Next does not depend on app SVG bundling;
- `documents/open-questions.md` records decisions that need user/product input;
- `documents/compatibility.md` records temporary bridges and exit criteria.

## Implemented so far

### Private fixture harness

Implemented:

- `window.zerro.exportPrivateFixture(name)`
- `scripts/private-fixture-summary.mjs`
- `src/core-next/testing/privateFixture.legacy.test.ts`
- `fixture:summary` script
- `fixture:test` script

Private fixture data must stay in ignored folders:

```txt
private-fixtures/
fixtures/private/
```

Example local commands:

```bash
node --max-old-space-size=4096 scripts/private-fixture-summary.mjs private-fixtures/zerro-private-fixture-my-large-account-20260706-0026.json
```

```bash
PRIVATE_FIXTURE=private-fixtures/zerro-private-fixture-my-large-account-20260706-0026.json node --max-old-space-size=4096 ./node_modules/vitest/vitest.mjs run src/core-next/testing/privateFixture.legacy.test.ts
```

### Core Next skeleton

Implemented:

```txt
src/core-next/
  index.ts
  constants.ts
  types.ts
  facade/
  documents/
  zenmoney/
  zerro/
```

`src/core-next/documents/README.md` is the documentation index.
`src/core-next/documents/testing.md` records the testing policy: focused unit
tests for domain rules, deterministic demo-data regression tests for migrated
read models, and opt-in private fixture parity tests for large real-world
accounts.

### Core Next session facade

Implemented:

- `createZerroSession`
- lazy memoized `session.read.*` methods over the migrated read projectors

`createZerroSession(data, ctx, dependencies)` is currently read-only. It uses
`ctx.now()` for date-dependent reads and keeps read results cached for the
session lifetime. This gives commands a non-Redux place to read derived domain
state later.

For now, the session still accepts adapter-prepared read dependencies for the
parts that are not yet core-owned input preparation:

- populated tags.

This keeps the session facade useful without pulling legacy `5-entities`,
Redux, i18n, icon assets, or display-currency state into core domain modules.
The FX read/converter graph is now core-owned and derived from normalized data.
Default envelope groups use stable core ids, with the Redux adapter mapping
them to localized labels for current UI and legacy selector compatibility.

### ZenMoney primitives

Implemented:

- `applyPatch`
- `applyPatchMutable`
- `replay`
- root user selectors:
  - `getRootUser`
  - `getRootUserId`
  - `getUserInstrumentId`
  - `getUserCurrency`
- debtors:
  - `buildDebtors`
  - `cleanPayee`
- balance history:
  - `buildTransactionEffect`
  - `buildBalances`
  - `buildBalancesByDate`
  - `getHistoryStart`
  - `convertBalancesToDisplay`
- FX rates:
  - `getStoredFxRates`
  - `buildCurrentFxRates`
  - `buildFxRates`
  - `buildFxRatesGetter`
  - `buildFxConverter`

`buildDebtors` is a pure ZenMoney-derived read model over transactions,
merchants, instruments, and the debt account id. It lives under
`zenmoney/debtors` because a plain ZenMoney client could still use it to show
how much the user owes or is owed by payee/merchant. Zerro consumes debtors as
one input when building debtor envelopes.

`buildBalances` and `buildBalancesByDate` are ZenMoney-derived read models over
transactions, accounts, debtors, merchants, instruments, and the debt account
id. They intentionally live under `zenmoney/balances`. Display-currency balance
conversion is exposed as a pure helper, with the app adapter providing the
display-currency converter.

FX rates are read from hidden monthly `FxRates` data plus current instrument
rates. `buildFxConverter` lives in `core-next/zerro/fx-rates`; the Redux adapter
uses it for core projections. Display-currency conversion remains an
adapter/display concern.

### Zerro hidden data readers

Implemented:

- `HiddenDataType`
- `parseHiddenDataComment`
- `getSimpleHiddenData`
- `getSimpleHiddenDataReminder`
- `getMonthlyHiddenData`
- `getMonthlyHiddenDataReminders`

Only read codecs are implemented. Write-path, service account creation, and migrations are still pending.

### Zerro settings/meta/envelope readers

Implemented:

- `getStoredUserSettings`
- `getUserSettings`
- `getEnvelopeMeta`
- `EnvType`
- `TEnvelopeId`
- `envId.get`
- `envId.parse`
- `buildEnvelopes`
- `getKeepingEnvelopes`
- `getEnvBudgets`
- `buildBudgets`
- `TrType`
- `getTransactionType`
- `compareTransactionDates`
- `buildRawActivity`
- `EnvActivity`
- `buildActivity`
- `buildSortedActivity`
- `buildMonthList`
- `buildCurrentFunds`
- `buildEnvMetrics`
- `buildMonthTotals`
- `getRawGoals`
- `goalType`
- `calcGoals`
- `buildGoals`
- `buildGoalTotals`

`buildEnvelopes` is a pure projector. It accepts prepared `debtors`,
`populatedTags`, `savingAccounts`, `envelopeMeta`, and `userCurrency`; it does
not import Redux selectors or call `i18next.t(...)` at module initialization.
Default envelope groups are stable ids such as `default:tags` and
`default:accounts`. The Redux adapter localizes those ids for current UI and
legacy selector comparisons.

`buildBudgets` is also a pure projector. It accepts prepared ZenMoney tag
budgets, hidden Zerro envelope budgets, and `preferZmBudgets`, preserving the
legacy precedence and skip rules.

`buildRawActivity` is a pure transaction-heavy projector. It accepts transaction
history, in-budget account ids, debt account id, debtors, and instruments. The
Redux adapter exposes it as `selectCoreRawActivity` with explicit dependencies.

`buildActivity`, `buildSortedActivity`, `buildEnvMetrics`, and
`buildMonthTotals` preserve the legacy projection graph as separate pure
projectors:

```txt
rawActivity -> activity -> envMetrics -> monthTotals
rawActivity -> sortedActivity
```

`buildMonthList` and `buildMonthTotals` accept `currentMonth` explicitly instead
of reading `Date.now()` inside the core projector.

Goals are ported as read projectors too. `getRawGoals` reads hidden monthly
goal data, `buildGoals` calculates per-envelope goal progress from raw goals,
month list, env metrics, sorted activity, and FX conversion, and
`buildGoalTotals` aggregates the result.

### Core-next Redux adapter

Implemented:

- `createZerroSession`
- `selectCoreUserSettings`
- `selectCoreEnvelopeMeta`
- `selectCoreEnvBudgets`
- `selectCoreStoredFxRates`
- `selectCoreCurrentFxRates`
- `selectCoreFxRates`
- `selectCoreFxRatesGetter`
- `selectCoreConvertFx`
- `selectCoreDebtors`
- `selectCoreBalances`
- `selectCoreBalancesByDate`
- `selectCoreDisplayBalancesByDate`
- `selectCoreStableEnvelopes`
- `selectCoreStableEnvelopeStructure`
- `selectCoreEnvelopes`
- `selectCoreEnvelopeStructure`
- `selectCoreKeepingEnvelopeIds`
- `selectCoreBudgets`
- `selectCoreCurrentMonth`
- `selectCoreMonthList`
- `selectCoreCurrentFunds`
- `selectCoreRawActivity`
- `selectCoreActivity`
- `selectCoreSortedActivity`
- `selectCoreEnvMetrics`
- `selectCoreMonthTotals`
- `selectCoreRawGoals`
- `selectCoreGoals`
- `selectCoreGoalTotals`

The adapter currently uses legacy upstream selectors for some prepared inputs,
but routes the domain projection through `core-next`. The read balance chain no
longer imports legacy `getMonthList`, `getCurrentFunds`, `getActivity`,
`getSortedActivity`, `getEnvMetrics`, or `getMonthTotals`. The adapter also no
longer imports legacy `debtorModel.getDebtors`; envelopes and raw activity now
use `selectCoreDebtors`.

Keep this graph explicit. Do not replace it with a single large
`current => readModel` selector; that would make transaction-heavy projections
recompute on unrelated budget or metadata changes.

## Current guardrails

### Keep the root facade package-ready

`src/core-next/index.ts` should not re-export implementation or adapter
subtrees such as `./zenmoney`, `./zerro`, or `./adapters/redux`.

Keep this:

```ts
export * from './constants'
export * from './types'
export * from './engine'
export * from './facade'
```

Import implementation and adapter APIs explicitly from their subpaths only while
they are needed by migration code, tests, or compatibility layers:

```ts
import { buildRawActivity } from 'core-next/zerro/activity'
import { selectCoreEnvelopes } from 'core-next/adapters/redux'
```

Reason: the root `core-next` facade should stay safe for storage-agnostic and
headless usage and future packaging. Re-exporting implementation or adapter
subtrees from root can turn internal module shape into public API and can pull
Redux, `5-entities`, i18n, or app assets into ordinary domain imports.

### Avoid private diffs in private fixture tests

Some new private fixture tests use `toEqual` on large private objects. If those
tests fail, Vitest may print private account data in the terminal.

Prefer SHA-256 hash comparisons or safe summaries, like
`src/core-next/testing/privateFixture.legacy.test.ts` already does.

### Type imports from `6-shared/types`

Current `core-next` modules still import normalized ZenMoney types from
`6-shared/types`. This is acceptable for the current migration stage.

Do not do a big-bang move of all entity types yet. The preferred path is:

1. keep temporary re-exports in `src/core-next/types.ts`;
2. define new Zerro-specific types directly in `core-next`;
3. move types together with modules as they stabilize;
4. only later consider moving normalized ZenMoney entity definitions out of
   `6-shared/types`.

The target remains that core-facing code eventually imports domain types from
`core-next`, but temporary legacy type imports are fine while the boundary is
still moving.

## Verified commands

```bash
./node_modules/.bin/tsc --noEmit
```

```bash
node ./node_modules/vitest/vitest.mjs run \
  src/core-next/zenmoney/users.test.ts \
  src/core-next/zenmoney/applyPatch.test.ts \
  src/core-next/zerro/hidden-data/read.test.ts \
  src/core-next/zerro/user-settings/read.test.ts \
  src/core-next/zerro/envelope-meta/read.test.ts \
  src/core-next/zerro/envelope-id/envelopeId.test.ts \
  src/core-next/zenmoney/debtors/read.test.ts \
  src/core-next/zenmoney/balances/build.test.ts \
  src/core-next/zerro/envelopes/build.test.ts \
  src/core-next/zerro/budgets/read.test.ts \
  src/core-next/zerro/budgets/build.test.ts \
  src/core-next/zenmoney/transactions.test.ts \
  src/core-next/zerro/activity/rawActivity.test.ts \
  src/core-next/zerro/activity/activity.test.ts \
  src/core-next/zerro/activity/sortedActivity.test.ts \
  src/core-next/zerro/activity/monthList.test.ts \
  src/core-next/zerro/activity/currentFunds.test.ts \
  src/core-next/zerro/activity/envMetrics.test.ts \
  src/core-next/zerro/activity/monthTotals.test.ts \
  src/core-next/zerro/goals/progress.test.ts \
  src/core-next/zerro/goals/build.test.ts \
  src/core-next/zerro/goals/totals.test.ts \
  src/core-next/adapters/redux/selectors.private-fixture.test.ts \
  src/core-next/zerro/read.private-fixture.test.ts
```

Private fixture legacy test also passed locally with the private fixture path above.

Core-next private fixture comparison passed locally:

```bash
PRIVATE_FIXTURE=private-fixtures/zerro-private-fixture-my-large-account-20260706-0026.json node --max-old-space-size=4096 ./node_modules/vitest/vitest.mjs run src/core-next/zerro/read.private-fixture.test.ts
```

Core-next Redux adapter private fixture comparison also passed locally:

```bash
PRIVATE_FIXTURE=private-fixtures/zerro-private-fixture-my-large-account-20260706-0026.json node --max-old-space-size=4096 ./node_modules/vitest/vitest.mjs run src/core-next/adapters/redux/selectors.private-fixture.test.ts
```

## Important findings

### Private fixture size

The first private fixture is large:

```txt
287.3 MB
24429 transactions
135 months
126 envelopes
```

This is acceptable for the first golden master.

### Legacy circular import

The legacy selector graph has a circular import around:

```txt
hidden-store/dataAccount
accountModel
```

The private fixture legacy test mocks `dataAccount` because it only needs read selectors, not hidden-data write-path.

### i18n affects legacy selectors

Some legacy envelope values are created from `i18next.t(...)` at module initialization time. The fixture exporter now records locale in the manifest, and the private fixture test sets i18n language before importing legacy selectors.

### JSON comparison semantics

Golden comparisons use stable JSON hashing and ignore object fields with `undefined`, because JSON export drops those fields.

## Recommended next steps

Move in small, testable layers. The read projection chain through
`monthTotals`, plus `sortedActivity` and goals, is now ported.
ZenMoney-derived `debtors` and account balance history are also ported.
Remaining useful follow-ups:

1. Use `src/core-next/documents/roadmap.md` to choose the next track.
2. Domain-specific hidden-data commands now cover user settings, envelope meta,
   env budgets, and goals.
3. Extend the envelope write command with entity-owned fields next: rename,
   tag color, and tag/account/merchant patches.
4. The test-infrastructure slice is deterministic demo data plus demo parity
   tests for already-migrated read models.
5. Continue replacing selected legacy imports with adapter imports from
   `core-next/adapters/redux`, one consumer at a time.
