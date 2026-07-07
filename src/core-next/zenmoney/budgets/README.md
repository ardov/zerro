# Budget

`Budget` is the normalized ZenMoney tag budget entity. It is separate from
hidden Zerro envelope budgets stored under `core-next/zerro/budgets`.

## Reads

The read layer exposes `getTagBudgets(data)` as the normalized budget map.
Zerro envelope-budget projectors decide how ZenMoney tag budgets interact with
hidden envelope budgets.

## Mutability

`compileSetTagBudget` mirrors the legacy tag-budget write path: it derives the
root user from the store, keeps existing budget fields when patching an existing
budget row, and creates ids from budget date plus tag id.

`makeTagBudget` preserves existing legacy defaults, including locked income and
outcome budgets by default.
