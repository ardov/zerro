# Instrument

`Instrument` is ZenMoney reference data for money units. In practice, Zerro
uses it mostly as currency metadata.

## Important Fields And Traps

- `shortTitle`: currency-code-like value such as `USD` or `EUR`. Core read
  models use it as `TFxCode`; it is not merely display text.
- `rate`: current ZenMoney exchange rate value. Zerro combines it with stored
  hidden FX rates in the Zerro FX layer.
- `changed`: normalized core timestamp in milliseconds. Raw ZenMoney sync data
  uses seconds.

## Mutability

Instruments are synchronized reference data. Core commands do not create,
patch, or delete instruments.

## Notes

Instrument ids are not currency codes. Use explicit helpers such as
`getInstrumentCodeById` when account or transaction instrument ids need to
become FX codes.
