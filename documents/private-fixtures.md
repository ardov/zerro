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

The browser exporter may download a single bundle file instead:

```txt
private-fixtures/
  my-large-account/
    fixture.json
```

That file should contain the same sections:

```json
{
  "schemaVersion": 1,
  "manifest": {},
  "input": {},
  "legacyOutput": {}
}
```

The single-file bundle is the preferred first implementation because browsers cannot reliably download a folder without extra packaging dependencies.

### `manifest.json`

The manifest describes how the fixture was produced.

Example:

```json
{
  "schemaVersion": 1,
  "createdAt": "2026-07-06T12:00:00.000Z",
  "appVersion": "1.9.3",
  "locale": "en",
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

Current first implementation:

```ts
await window.zerro.exportPrivateFixture('my-large-account')
```

This downloads one JSON bundle that can be moved into:

```txt
private-fixtures/my-large-account/fixture.json
```

After downloading, validate the fixture shape and print a safe summary:

```bash
pnpm fixture:summary private-fixtures/my-large-account/fixture.json
```

The summary command prints only metadata and counts. It must not print account names, transactions, comments, payees, or any other private values.

To verify that the fixture can reproduce current legacy selector outputs:

```bash
PRIVATE_FIXTURE=private-fixtures/my-large-account/fixture.json pnpm fixture:test
```

This test is skipped unless `PRIVATE_FIXTURE` is provided.

The test compares SHA-256 hashes of each large output instead of using normal deep equality diffs. That avoids dumping private data or huge object diffs to the terminal if something changes.

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
2. Add a local developer export function available as `window.zerro.exportPrivateFixture(name)`.
3. Export `input` from `state.data.current`.
4. Export `legacyOutput` for:
   - monthList;
   - envelopes;
   - envelopeStructure;
   - keepingEnvelopeIds;
   - budgets;
   - rawActivity;
   - activity;
   - sortedActivity;
   - envMetrics;
   - monthTotals.
5. Add a local compare script that reads from `private-fixtures/<name>`.
6. Keep the compare script safe to commit, but keep fixture data ignored.
