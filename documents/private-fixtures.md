# Private fixtures workflow

Date: 2026-07-06  
Status: proposed workflow

## Goal

We need realistic test data from a large real account to compare the legacy selectors/commands with `core-next`.

The fixture must contain:

1. raw input data;
2. legacy calculated outputs;
3. enough metadata to reproduce the calculation;
4. no accidental commits of private account data.

## Storage location

Private fixtures must live outside tracked source files.

Use one of these ignored folders:

```txt
private-fixtures/
fixtures/private/
```

Both folders are ignored by `.gitignore`.

Do not place private fixtures under `src/`, `documents/`, or any tracked test fixture folder.

## Fixture shape

Each fixture should be a folder:

```txt
private-fixtures/
  my-large-account/
    manifest.json
    input.json
    legacy-output.json
```

### `manifest.json`

The manifest describes how the fixture was produced.

Example:

```json
{
  "schemaVersion": 1,
  "createdAt": "2026-07-06T12:00:00.000Z",
  "appVersion": "1.9.3",
  "source": "real-account-private",
  "inputKind": "normalized-current-data",
  "outputs": [
    "envelopes",
    "budgets",
    "rawActivity",
    "activity",
    "envMetrics",
    "monthTotals"
  ],
  "notes": "Private local fixture. Must not be committed."
}
```

### `input.json`

The input should be the normalized data snapshot used by selectors.

For `core-next` comparisons, normalized app data is more useful than raw ZenMoney API backup, because the legacy selectors also work on normalized `state.data.current`.

Suggested first version:

```json
{
  "schemaVersion": 1,
  "data": {
    "serverTimestamp": 0,
    "instrument": {},
    "country": {},
    "company": {},
    "user": {},
    "merchant": {},
    "account": {},
    "tag": {},
    "budget": {},
    "reminder": {},
    "reminderMarker": {},
    "transaction": {}
  }
}
```

We may also export the server-format backup separately, but it should not be the primary comparison input.

### `legacy-output.json`

The output should contain selected results from the current legacy selectors.

Suggested first version:

```json
{
  "schemaVersion": 1,
  "outputs": {
    "envelopes": {},
    "budgets": {},
    "rawActivity": {},
    "activity": {},
    "envMetrics": {},
    "monthTotals": {}
  }
}
```

## Export strategy

Add a local-only developer export tool that runs inside the current app and downloads a private fixture bundle.

The exporter should read:

```ts
const state = store.getState()
```

And write:

```ts
input = state.data.current

legacyOutput = {
  envelopes: envelopeModel.getEnvelopes(state),
  budgets: budgetModel.get(state),
  rawActivity: balances.rawActivity(state),
  activity: balances.activity(state),
  envMetrics: balances.envData(state),
  monthTotals: balances.totals(state),
}
```

The exporter should be clearly marked as a local developer tool and should not upload data anywhere.

## Why export outputs

The purpose is not only to test that `core-next` runs.

The purpose is to prove that `core-next` matches the current behavior:

```ts
const input = loadFixtureInput()
const legacy = loadFixtureLegacyOutput()

const next = createZerroSession(input, testCtx)

expect(next.read.envelopes()).toEqual(legacy.outputs.envelopes)
expect(next.read.budgets()).toEqual(legacy.outputs.budgets)
expect(next.read.envMetrics()).toEqual(legacy.outputs.envMetrics)
```

For command migration, compare resulting state, not only patch shape:

```ts
const nextPatch = next.envelopes.rename(id, name)
const nextState = applyPatch(input, nextPatch)

expect(nextState).toEqual(legacyStateAfterRunningOldThunk)
```

## Serialization concerns

Some current selector outputs contain transaction object references and large arrays.

That is acceptable for the first private fixture, but the exporter should keep the output intentionally scoped.

If the fixture becomes too large, prefer exporting:

- selected months;
- selected envelope ids;
- aggregate amounts;
- transaction ids instead of full transaction objects in derived outputs.

Do not optimize this too early. The first fixture should favor correctness and coverage.

## Privacy rules

1. Private fixtures must stay in ignored folders.
2. Never commit `private-fixtures/` or `fixtures/private/`.
3. Never paste fixture contents into issues, PRs, docs, or chat.
4. If a small public fixture is needed, create a separate anonymized/minimized fixture by hand.
5. Treat screenshots of private fixture outputs as private too.

## Recommended first implementation

1. Add `.gitignore` entries for private fixture folders.
2. Add a local developer export function.
3. Export `input.json` from `state.data.current`.
4. Export `legacy-output.json` for:
   - envelopes;
   - budgets;
   - rawActivity;
   - activity;
   - envMetrics;
   - monthTotals.
5. Add a local compare script that reads from `private-fixtures/<name>`.
6. Keep the compare script safe to commit, but keep fixture data ignored.

