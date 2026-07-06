# Country

`Country` is ZenMoney reference data used by users, companies, and currency
defaults.

## Important Fields And Traps

- `currency`: default country currency as an `Instrument` id, not an FX code.
- `domain`: optional ZenMoney country-specific domain from reference data.

## Mutability

Countries are synchronized reference data. Core commands do not create, patch,
or delete countries.
