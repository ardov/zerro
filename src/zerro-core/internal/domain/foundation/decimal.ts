import Decimal from 'decimal.js-light'

// Two finite JS numbers can each contribute 17 significant decimal digits
// to a quoted value. Keep their product and sums at that precision.
export const MoneyDecimal = Decimal.clone({ precision: 40 })
