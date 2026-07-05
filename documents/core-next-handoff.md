# Core Next handoff

Date: 2026-07-06  
Branch: `core-next`

## Current state

The initial architecture and private fixture workflow are documented in:

- `documents/core-next-architecture.md`
- `documents/private-fixtures.md`

The current branch has these recent commits:

```txt
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
- `buildEnvelopes`
- `getKeepingEnvelopes`
- `getEnvBudgets`
- `buildBudgets`
- `TrType`
- `getTransactionType`
- `compareTransactionDates`
- `buildRawActivity`
- `EnvActivity`

`buildEnvelopes` is a pure projector. It accepts prepared `debtors`,
`populatedTags`, `savingAccounts`, `envelopeMeta`, `userCurrency`, and explicit
group `labels`; it does not import Redux selectors or call `i18next.t(...)` at
module initialization.

`buildBudgets` is also a pure projector. It accepts prepared ZenMoney tag
budgets, hidden Zerro envelope budgets, and `preferZmBudgets`, preserving the
legacy precedence and skip rules.

`buildRawActivity` is a pure transaction-heavy projector. It accepts transaction
history, in-budget account ids, debt account id, debtors, and instruments. The
Redux adapter exposes it as `selectCoreRawActivity` with explicit dependencies.

### Core-next Redux adapter

Implemented:

- `selectCoreUserSettings`
- `selectCoreEnvelopeMeta`
- `selectCoreEnvBudgets`
- `selectCoreEnvelopes`
- `selectCoreEnvelopeStructure`
- `selectCoreKeepingEnvelopeIds`
- `selectCoreBudgets`
- `selectCoreRawActivity`

The adapter currently uses legacy upstream selectors for prepared inputs, but
routes the domain projection through `core-next`.

## Review notes before committing current agent changes

The current uncommitted agent work mostly matches the plan and passes checks, but
two small fixes are recommended before committing it.

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
  src/core-next/zerro/envelopes/build.test.ts \
  src/core-next/zerro/budgets/read.test.ts \
  src/core-next/zerro/budgets/build.test.ts \
  src/core-next/zenmoney/transactions.test.ts \
  src/core-next/zerro/activity/rawActivity.test.ts \
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

Move in small, testable layers.

### 1. Add Zerro user settings read helpers

Done. Implemented in `core-next` using hidden-data readers:

```ts
getStoredUserSettings(data)
getUserSettings(data)
```

Expected defaults:

```ts
{
  sawMigrationAlert: false,
  preferZmBudgets: false,
  emojiIcons: false
}
```

Tests:

- unit tests with small fixture data;
- compare against legacy selector on private fixture.

### 2. Add envelope meta read helpers

Done. Implemented:

```ts
getEnvelopeMeta(data)
```

This should read `HiddenDataType.EnvelopeMeta` with `{}` default.

Tests:

- unit tests;
- compare against legacy selector/private fixture.

### 3. Add basic envelope id helpers/types

Done. Ported:

```txt
EnvType
TEnvelopeId
envId.parse
envId.get
```

Target names can stay close to legacy for now.

Tests:

- parse/get roundtrip;
- null tag id handling.

### 4. Start `buildEnvelopes`

Done. It does not import Redux selectors into core.

Target shape:

```ts
buildEnvelopes({
  debtors,
  populatedTags,
  savingAccounts,
  envelopeMeta,
  userCurrency,
  labels,
})
```

Important: avoid `i18next.t(...)` at module initialization. Pass default group labels explicitly, probably through `labels`.

Tests:

- small unit tests;
- compare core envelopes with `legacyOutput.envelopes` from private fixture.

### 5. Move budgets

Done. Implemented:

```ts
buildBudgets({
  tagBudgets,
  envBudgets,
  preferZmBudgets,
})
```

Compare with `legacyOutput.budgets`.

Also implemented:

```ts
getEnvBudgets(data)
```

Tests:

- unit tests for hidden monthly budget reads;
- unit tests for ZenMoney-vs-hidden precedence;
- compare core budgets with legacy selector on private fixture.

### 6. Add Redux adapter selectors

Done. Implemented adapter selectors while preserving explicit dependencies.

After projectors exist, create adapter-level selectors that preserve explicit dependencies.

Do not create one large selector like:

```ts
createSelector([selectCurrent], current => createReadModel(current))
```

That would invalidate expensive transaction projections too often.

### 7. Move heavy projections

Order:

```txt
rawActivity - done
activity
envMetrics
monthTotals
```

Preserve explicit dependencies so `rawActivity` does not recompute on unrelated budget/meta changes.
