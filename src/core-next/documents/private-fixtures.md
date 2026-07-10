# Private fixture workflow

- Status: implemented, opt-in
- Updated: 2026-07-10

Private fixtures compare Core Next with legacy behavior on a large real account
without committing or printing private data.

## Safety rules

1. Store fixtures only under ignored `private-fixtures/` or
   `fixtures/private/` directories.
2. Never place them under `src/` or tracked fixture folders.
3. Never paste fixture contents into chat, issues, PRs, logs, or screenshots.
4. Failures must use SHA-256 hashes or safe count summaries, not deep object
   diffs.
5. Scripts and tests are safe to commit; fixture data is not.

## Export

In a local development session with the target account loaded:

```ts
await window.zerro.exportPrivateFixture('my-large-account')
```

Move the downloaded JSON bundle into an ignored path, for example:

```txt
private-fixtures/my-large-account/fixture.json
```

The bundle contains:

```txt
schemaVersion
manifest       creation time, app version, locale, source, output names
input          normalized state.data.current snapshot
legacyOutput   selected legacy selector results
```

The exporter is a local developer tool and uploads nothing.

## Safe inspection

Print metadata and counts only:

```bash
pnpm fixture:summary private-fixtures/my-large-account/fixture.json
```

The summary must not print account names, comments, payees, transaction values,
or other private fields.

## Parity tests

Legacy-output reproduction:

```bash
PRIVATE_FIXTURE=private-fixtures/my-large-account/fixture.json pnpm fixture:test
```

Core read and Redux adapter parity can be run directly when needed:

```bash
PRIVATE_FIXTURE=private-fixtures/my-large-account/fixture.json \
  node --max-old-space-size=4096 ./node_modules/vitest/vitest.mjs run \
  src/core-next/zerro/read.private-fixture.test.ts \
  src/core-next/adapters/redux/selectors.private-fixture.test.ts
```

These tests skip when `PRIVATE_FIXTURE` is absent.

## What to compare

Useful read outputs include:

- month list;
- envelopes and structure;
- keeping-envelope ids;
- budgets;
- raw and sorted activity;
- activity, env metrics, and month totals;
- goals, debtors, and balances when relevant.

For commands, compare resulting normalized state rather than only patch shape.
Keep output scope intentional: large derived structures may contain full
transaction arrays and object references.

## Serialization notes

- JSON drops fields with `undefined`; stable comparisons intentionally follow
  JSON semantics.
- The fixture manifest records locale because legacy envelope presentation can
  depend on i18n initialization.
- The legacy private test mocks the hidden-store data-account cycle because it
  needs read selectors only.
- If a fixture becomes too large, reduce selected months/ids or store safe
  aggregates rather than weakening privacy protections.

## Known local fixture

The first large fixture was approximately:

```txt
287.3 MB
24,429 transactions
135 months
126 envelopes
```

That size is acceptable for an opt-in local golden master. Do not add it to
ordinary CI or repository history.
