# ZenMoney Core

ZenMoney Core owns normalized ZenMoney domain types, read models, and write
commands. Raw ZenMoney sync shapes are secondary and are named `TZm*`.

## Reading Order

Start with infrastructure and reference data, then move toward entities with
more dependencies:

1. `primitives`: shared domain primitives such as timestamp units.
2. `instruments`: currency metadata used by countries, users, accounts,
   reminders, reminder markers, transactions, and FX conversion.
3. `countries`: country reference data used by users and companies.
4. `companies`: bank and provider reference data used by accounts and
   transactions.
5. `users`: root user and user currency helpers.
6. `merchants`: payee-like transaction entities used by reminders, reminder
   markers, transactions, and debtors.
7. `tags`: category entities used by budgets, reminders, reminder markers, and
   transactions.
8. `accounts`: user-owned accounts used by reminders, reminder markers,
   transactions, debtors, and balances.
9. `budgets`: ZenMoney tag budgets; these are separate from hidden Zerro
   envelope budgets.
10. `reminders`: scheduled transaction templates.
11. `reminderMarkers`: concrete reminder occurrences that can be linked from transactions.
12. `transactions`: highest-dependency mutable entity; transaction commands and
    transaction read helpers.
13. `debtors`: derived debt/payee balances from transactions.
14. `balances`: derived balance history read models.

The order is dependency-oriented, not the exact `TDataStore` field order. The
store field order is:

```txt
instrument -> country -> company -> user -> merchant -> account -> tag ->
budget -> reminder -> reminderMarker -> transaction
```

## Current Migration Status

Legend:

- `done`: enough for the current Zerro Core read/command layer.
- `partial`: useful code exists, but type ownership or module shape is not done.
- `pending`: not represented as a Zerro Core ZenMoney entity module yet.

| Area              | Status | Notes                                                                                                                                       |
| ----------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `primitives`      | done   | Timestamp unit aliases live in Zerro Core.                                                                                                  |
| `instruments`     | done   | Core-owned types and map read helper are in place.                                                                                          |
| `countries`       | done   | Core-owned types and map read helper are in place.                                                                                          |
| `companies`       | done   | Core-owned types and map read helper are in place.                                                                                          |
| `users`           | done   | Core-owned types and root user/currency reads are in place.                                                                                 |
| `merchants`       | done   | Core-owned types, map read helper, production factory, and patch command compiler are in place.                                             |
| `tags`            | done   | Core-owned types, map read helper, production factory, and create/patch command compilers are in place; `archive` is part of the tag shape. |
| `accounts`        | done   | Core-owned types, account-only reads, production factory, and create/patch/delete command compilers are in place.                           |
| `budgets`         | done   | Core-owned types, map read helper, production factory, id helper, and set-tag-budget command compiler are in place.                         |
| `reminders`       | done   | Core-owned types, map read helper, production factory, and set/delete command compilers are in place.                                       |
| `reminderMarkers` | done   | Core-owned types, map read helper, and production factory are in place; no legacy marker command is migrated yet.                           |
| `transactions`    | done   | Core-owned types, reads, production factory, and intent-only command compilers are in place.                                                |
| `debtors`         | done   | ZenMoney-derived read model is in Zerro Core.                                                                                               |
| `balances`        | done   | ZenMoney-derived balance history read model is in Zerro Core.                                                                               |

## Dependency Notes

- `Instrument` should stay first among reference data because many entities hold
  instrument ids and FX conversion depends on instrument codes/rates.
- `Country` and `Company` are synchronized reference data. Users and companies
  use countries; accounts and transactions may reference companies. Country
  `currency` is an instrument id, not an FX code. Company `deleted` entries
  can remain in synced data; neither entity has user commands.
- `Budget` depends on users and tags, but Zerro envelope budgets are a separate
  hidden-data projection under `zerro-core/domain/zerro/budgets`. ZenMoney tag
  budgets default to locked income and outcome values.
- `Merchant` is a user-owned payee-normalization entity used by transactions,
  debtors, and envelope-like projections.
- `Reminder` and `ReminderMarker` depend on users, instruments, accounts, tags,
  and merchants. Markers also depend on reminders; Core owns their factory but
  has no marker write command yet.
- `Transaction` should stay last among normalized ZenMoney entities because it
  can reference user, company, instrument, account, tag, merchant, and reminder
  marker data.
- Derived reads such as `debtors` and `balances` come after transactions because
  they scan transaction history.

Small entities stay as flat modules; entities with multiple cohesive concerns
keep folders. Ordering belongs in this README and `index.ts`, not path names.

## Type Ownership

Core-owned types describe the normalized data shape used by the app:

```ts
type TCompany = {
  changed: TMsTime
}
```

ZenMoney wire/sync shapes are derived from core types when they differ:

```ts
type TZmCompany = Omit<TCompany, 'changed'> & {
  changed: TUnixTime
}
```

During migration, `6-shared/types` may re-export core-owned types so legacy code
can keep importing from the old facade while ownership moves into `zerro-core`.

## Read Layer Shape

Low-level entity reads should stay close to normalized data. Prefer map reads
such as `getAccounts(data)` or `getTags(data)` and explicit entity facts such as
`getDebtAccountId(data)`. Avoid adding presentation-ready, FX-resolved, or
Zerro-convention-aware entity rows to ZenMoney reads. Projectors that need FX
codes should receive the normalized entity map plus `instrumentCodeById` and
resolve the currency inside the projector.

## Documentation

See [sync-api.md](./sync-api.md) for behavior observed against the live ZenMoney
sync endpoint, including version comparison, acknowledgements, wire shape, and
server-side materialization.

Use field comments for non-obvious invariants: timestamp units, wire-vs-core
differences, reference-data deletion flags, and fields that are easy to confuse.
Keep domain explanations, relationships, and mutability beside the relevant
flat entity module.
