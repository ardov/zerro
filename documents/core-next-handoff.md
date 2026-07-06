# Core Next handoff

Date: 2026-07-06  
Branch: `core-next`

## Current state

The initial architecture and private fixture workflow are documented in:

- `documents/core-next-architecture.md`
- `documents/private-fixtures.md`

The current branch has these recent commits:

```txt
73df977e Add core-next sorted activity and balance inputs
e739c3bc Add core-next activity metrics and month totals projections
59d043eb Add core-next envelope budget and raw activity projections
763b8552 Add private fixture harness
18185f48 Add core-next patch primitives
050ec4a2 Add core-next hidden data readers
12248392 Add core-next user selectors
```

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
  zenmoney/
  zerro/
```

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
- `buildDebtors`
- `cleanPayee`
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

`buildEnvelopes` is a pure projector. It accepts prepared `debtors`,
`populatedTags`, `savingAccounts`, `envelopeMeta`, `userCurrency`, and explicit
group `labels`; it does not import Redux selectors or call `i18next.t(...)` at
module initialization.

`buildDebtors` is a pure Zerro projector over ZenMoney-shaped transactions,
merchants, instruments, and the debt account id. It intentionally lives under
`zerro/debtors`, because debtors are a derived Zerro concept, not a first-class
ZenMoney entity.

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

### Core-next Redux adapter

Implemented:

- `selectCoreUserSettings`
- `selectCoreEnvelopeMeta`
- `selectCoreEnvBudgets`
- `selectCoreDebtors`
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
  src/core-next/zerro/debtors/read.test.ts \
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
`monthTotals`, plus `sortedActivity` and `debtors`, is now ported. Remaining
useful follow-ups:

1. Consider goals next if we want another read-model layer. `getGoals` depends
   on hidden monthly goals, month list, envMetrics, sortedActivity, and FX
   conversion; the projection side is now mostly unblocked.
2. Alternatively start hidden-data write codecs for user settings, envelope
   meta, env budgets, and goals, which is the more direct path toward commands.
3. Start replacing selected legacy imports with adapter imports from
   `core-next/adapters/redux`, one consumer at a time.
4. Start command/session work only after the read-model comparison surface is
   stable enough for regression checks.
