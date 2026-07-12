# Instrument

`Instrument` is ZenMoney reference data for money units. In practice, Zerro
uses it mostly as currency metadata.

## Important Fields And Traps

- `shortTitle`: currency-code-like value such as `USD` or `EUR`. Core read
  models use it as `TFxCode`; it is not merely display text.
- `rate`: current ZenMoney exchange rate value.
- `changed`: normalized core timestamp in milliseconds. Raw ZenMoney sync data
  uses seconds.

## Mutability

Instruments are system objects and cannot be mutated by users.

## Notes

- Zerro uses current exchange rates for FX conversions.
- Crypto currencies ('ASH', 'BCH', 'BTC', 'ETH', 'LTC', 'XMR') are actually micro-currencies and scaled by 1,000,000.
