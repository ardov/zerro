/**
 * Field equality as ZenMoney canonicalizes it.
 *
 * A value that differs from the stored one only by a canonicalization is not a
 * change: writing it would produce the value already there. Both the command
 * compiler, which drops no-op fields at issue time, and `diffStores`, which
 * decides what a restore has to write at all, must agree on this — otherwise a
 * diff proposes writes the compiler immediately discards.
 */
export function isSameFieldValue(
  field: string,
  left: unknown,
  right: unknown
): boolean {
  // ZenMoney canonicalizes an empty transaction comment to null.
  if (field === 'comment') return (left ?? '') === (right ?? '')

  if (Array.isArray(left) && Array.isArray(right)) {
    return (
      left.length === right.length &&
      left.every((value, index) => Object.is(value, right[index]))
    )
  }
  return Object.is(left, right)
}
