# Instrument

`Instrument` is ZenMoney reference data for money units. In practice, Zerro
uses it mostly as currency metadata.

## Important Fields

- `id`: numeric ZenMoney instrument id. Accounts and transactions reference
  instruments by this id.
- `shortTitle`: currency-code-like value such as `USD` or `EUR`. Core read
  models use it as `TFxCode`.
- `title`: human-readable instrument name from ZenMoney.
- `symbol`: display symbol from ZenMoney.
- `rate`: current ZenMoney exchange rate value. Zerro combines it with stored
  hidden FX rates in the Zerro FX layer.
- `changed`: normalized millisecond timestamp in core data.

## Mutability

Instruments are synchronized reference data. Core commands do not create,
patch, or delete instruments.

## Notes

Instrument ids are not currency codes. Domain code should use explicit helpers
such as `getInstrumentCodeById` when it needs to convert account or transaction
instrument ids into FX codes.
