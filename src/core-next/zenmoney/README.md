# ZenMoney Core

ZenMoney Core owns normalized ZenMoney domain types, read models, and write
commands. Raw ZenMoney sync shapes are secondary and are named `TZm*`.

## Reading Order

Start with infrastructure and reference data, then move toward entities with
more dependencies:

1. `primitives`: shared domain primitives such as timestamp units.
2. `instruments`: currency metadata used by users, accounts, transactions, and
   FX conversion.
3. `companies`: bank and provider reference data.
4. `users`: root user and user currency helpers.
5. `accounts`: user-owned accounts and account write commands.
6. `merchants`: payee-like transaction entities.
7. `tags`: category entities.
8. `transactions`: transaction commands, transaction read helpers, and account
   balance effects.
9. `debtors`: derived debt/payee balances from transactions.
10. `balances`: derived balance history read models.

Folders are intentionally not numbered. Import paths are part of the future
library API, so ordering belongs in this README and in `index.ts`, not in path
names.

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
can keep importing from the old facade while ownership moves into `core-next`.

## Documentation

Use field comments for non-obvious invariants: timestamp units, wire-vs-core
differences, reference-data deletion flags, and fields that are easy to confuse.
Use entity READMEs for domain explanations, relationships, mutability, and
module-level guidance.
