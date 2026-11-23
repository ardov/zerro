/** Half-cent ties go toward positive infinity. Keep this in sync with 6-shared/helpers/money/currencyHelpers.ts. */
export function round(amount: number): number {
  if (!Number.isFinite(amount)) return amount
  if (amount === 0) return 0
  // Away from a half-cent, multiplication is safely within the rounding margin.
  const cents = amount * 100
  const whole = Math.round(cents)
  const margin = Math.max(1e-9, Math.abs(cents) * 8 * Number.EPSILON)
  if (
    Math.abs(cents) < 2 ** 52 &&
    Math.abs(Math.abs(cents - whole) - 0.5) > margin
  ) {
    return whole / 100 + 0
  }
  // Shift the printed decimal near ties: 1.005 * 100 falls below 100.5 in binary.
  const shifted = Number(`${amount}e2`)
  // At this point only large amounts can print with an exponent. They are
  // already whole numbers.
  if (!Number.isFinite(shifted)) return amount
  const rounded = Number(`${Math.round(shifted)}e-2`)
  return Number.isFinite(rounded) ? rounded : amount
}
