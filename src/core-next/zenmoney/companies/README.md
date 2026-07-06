# Company

`Company` is ZenMoney reference data for banks and financial providers.
Transactions can reference companies through bank id fields.

## Important Fields

- `id`: numeric ZenMoney company id. Transaction bank-id fields reference this.
- `title`: short display name.
- `fullTitle`: full legal or provider name when ZenMoney has one.
- `www`: company website from ZenMoney reference data.
- `country`: numeric ZenMoney country id.
- `countryCode`: country code string from ZenMoney reference data.
- `deleted`: marks deleted or deprecated reference entries.
- `changed`: normalized millisecond timestamp in core data.

## Mutability

Companies are synchronized reference data. Core commands do not create, patch,
or delete companies.

## Notes

Do not confuse `Company` with `Merchant`. `Company` usually describes a bank or
financial provider from ZenMoney reference data, while `Merchant` is a payee-like
entity used by transactions.
