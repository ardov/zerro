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

## Verified commands

```bash
./node_modules/.bin/tsc --noEmit
```

```bash
node ./node_modules/vitest/vitest.mjs run \
  src/core-next/zenmoney/users.test.ts \
  src/core-next/zenmoney/applyPatch.test.ts \
  src/core-next/zerro/hidden-data/read.test.ts
```

Private fixture legacy test also passed locally with the private fixture path above.

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

Implement in `core-next` using hidden-data readers:

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

Implement:

```ts
getEnvelopeMeta(data)
```

This should read `HiddenDataType.EnvelopeMeta` with `{}` default.

Tests:

- unit tests;
- compare against legacy selector/private fixture.

### 3. Add basic envelope id helpers/types

Port:

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

Do not import Redux selectors into core.

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

### 5. Add Redux adapter selectors later

After projectors exist, create adapter-level selectors that preserve explicit dependencies.

Do not create one large selector like:

```ts
createSelector([selectCurrent], current => createReadModel(current))
```

That would invalidate expensive transaction projections too often.

### 6. Then move budgets

After envelopes/user settings/meta are stable:

```ts
buildBudgets({
  tagBudgets,
  envBudgets,
  preferZmBudgets,
})
```

Compare with `legacyOutput.budgets`.

### 7. Heavy projections come after that

Order:

```txt
rawActivity
activity
envMetrics
monthTotals
```

Preserve explicit dependencies so `rawActivity` does not recompute on unrelated budget/meta changes.

