# Core Next Testing Policy

Core Next tests should protect domain behavior and migration parity without
turning every thin helper into a permanent test burden.

## Keep Unit Tests When They Protect Rules

Unit tests are valuable for:

- patch primitives: immutability, deletion, replay ordering;
- commands: compiled patch shape, deterministic ids and timestamps, validation,
  and account balance side effects;
- transactions and activity: income, outcome, transfer, debt, internal fees,
  sorting, and month boundaries;
- balances and FX: history start, day filling, conversion, instrument handling;
- hidden data: malformed comments, missing data, simple vs monthly stores;
- envelopes, budgets, and goals: precedence, visibility, parent/group/index,
  and month-dependent behavior.

## Avoid Low-Value Unit Tests

Do not add or keep tests that only prove a direct map lookup works, for example:

```ts
expect(getCompanies(data)).toBe(data.company)
expect(getCountry(data, 1)).toBe(data.country[1])
```

Those tests are useful only when the helper owns a meaningful contract such as:

- converting missing values to `null`;
- filtering deleted or inactive data;
- normalizing ids, dates, currencies, or hidden payloads;
- preserving legacy behavior that is not obvious from the implementation.

When a module is mostly direct reference-data access, prefer a compact contract
test or no unit test at all.

## Use Demo Data For Regression Tests

Demo data is the right fixture layer for migrated read models and session reads.
It should be deterministic and parameterized:

```ts
makeDemoDiff({ now, until, scale })
makeDemoStore({ now, until, scale })
```

The app-facing demo loader can use friendly defaults, but tests must pin time and
size so results are stable.

The shared generator should avoid importing Redux, React, app thunks, or legacy
`5-entities` modules. App-level wrappers can adapt the shared generator for the
current demo login flow.

## Use Private Fixtures Sparingly

Private or anonymized fixtures are for high-confidence parity checks on large
realistic accounts. They should stay opt-in through environment variables and
must not print raw private data on failure.

For large outputs, compare stable hashes or safe summaries first. Only add a
small diagnostic diff for public, non-sensitive fields when it helps locate the
problem.

## Builder Guidance

Test builders should be boring defaults with explicit overrides:

```ts
makeTransaction({ id: 'salary', income: 100, tag: ['Salary'] })
```

Shared builders live in:

- `src/core-next/testing/zenmoneyTestData.ts` for normalized ZenMoney stores and
  entities;
- `src/core-next/testing/zerroTestData.ts` for Zerro projection result shapes.

Avoid scenario builders that hide the behavior under test. If a test depends on
an account, instrument, tag, or date, the important fields should remain visible
inside the test case.
