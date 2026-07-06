# Core Next handoff

Date: 2026-07-06  
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
9b3ea3d4 Shape core-next merchant entity layer
46128a48 Polish core-next account entity layer
6847cc44 Document ZenMoney entity dependency order
ee37daee Summarize core-next roadmap
686bb664 Extract core-next test data builders
aba677c9 Move core-next docs into module
```

Recent Track B work in `zenmoney/merchants`:

- merchant types now live under `src/core-next/zenmoney/merchants/types.ts`;
- `getMerchants` and `getMerchant` are exposed from
  `src/core-next/zenmoney/merchants/read.ts`;
- `makeMerchant` is a production factory with deterministic `now` and `uuid`
  dependencies;
- `compilePatchMerchant` now uses the merchant read layer and exports the local
  `TMerchantPatch` type instead of the longer temporary name;
- merchant tests cover reads, factory defaults, and patch behavior.

This run also adds Track B work in `zenmoney/tags`:

- tag types now live under `src/core-next/zenmoney/tags/types.ts`, and
  `6-shared/types` re-exports them like the other migrated ZenMoney entities;
- `getTags` and `getTag` are exposed from
  `src/core-next/zenmoney/tags/read.ts`;
- `makeTag` is a production factory for ordinary tags with deterministic `now`
  and `uuid` dependencies;
- `compileCreateTag` and `compilePatchTag` now use local `TTagDraft` and
  `TTagPatch` names, plus the tag read/factory layers;
- populated tags, tag trees, and localized `nullTag` remain outside this
  normalized ZenMoney entity slice for now.

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

### Do not export Redux adapter from root facade

`src/core-next/index.ts` should not re-export `./adapters/redux`.

Keep this:

```ts
export * from './constants'
export * from './types'
export * from './zenmoney'
export * from './zerro'
```

Import Redux adapter selectors explicitly:

```ts
import { selectCoreEnvelopes } from 'core-next/adapters/redux'
```

Reason: the root `core-next` facade should stay safe for storage-agnostic and
headless usage. Re-exporting Redux adapters from root can pull Redux,
`5-entities`, and i18n adapter dependencies into ordinary domain imports.

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
2. The most conservative next domain slice is `zenmoney/transactions`: type
   ownership and full entity module shape review.
3. The most direct command-enabling slice is hidden-data write codecs for user
   settings, envelope meta, env budgets, and goals.
4. The test-infrastructure slice is deterministic demo data plus demo parity
   tests for already-migrated read models.
5. Continue replacing selected legacy imports with adapter imports from
   `core-next/adapters/redux`, one consumer at a time.
