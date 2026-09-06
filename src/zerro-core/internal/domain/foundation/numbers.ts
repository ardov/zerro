/** Decimal arithmetic used by financial calculations.
 *
 * Money is counted to two decimals, and a half-cent rounds up. Ties on
 * negative amounts go towards positive infinity, which is what `Math.round`
 * has always done here.
 *
 * The application layer keeps its own copy in
 * `6-shared/helpers/money/currencyHelpers.ts`: Core owns no dependency on
 * `6-shared`, so the two cannot be one. Change them together.
 */
export function round(amount: number): number {
  if (!Number.isFinite(amount)) return amount
  // The decimal point is moved through the number's own printed form rather
  // than by multiplying. 1.005 is stored as 1.00499999999999989, so
  // `1.005 * 100` is 100.49999999999999 and rounds down to a cent nobody
  // typed. `${amount}` prints the shortest text that reads back as the same
  // number — "1.005" — so "1.005e2" parses as exactly 100.5.
  const shifted = Number(`${amount}e2`)
  // A number JavaScript already prints with an exponent cannot have a second
  // one pasted on the end. Every double that big is a whole one — past 2^53
  // there are no fractions left to round — so it is already the answer.
  if (!Number.isFinite(shifted)) return amount
  const rounded = Number(`${Math.round(shifted)}e-2`)
  return Number.isFinite(rounded) ? rounded : amount
}
