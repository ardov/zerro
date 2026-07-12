# Company

`Company` is ZenMoney reference data for banks and financial providers.
Transactions can reference companies through bank id fields.

## Important Fields And Traps

- `deleted`: marks deleted or deprecated reference entries. Such entries may
  still be present in synchronized data.
- `changed`: normalized core timestamp in milliseconds. Raw ZenMoney sync data
  uses seconds.

## Mutability

Companies are synchronized reference data. Core commands do not create, patch,
or delete companies.

## Notes

Do not confuse `Company` with `Merchant`. `Company` usually describes a bank or
financial provider from ZenMoney reference data, while `Merchant` is a payee-like
entity used by transactions.
