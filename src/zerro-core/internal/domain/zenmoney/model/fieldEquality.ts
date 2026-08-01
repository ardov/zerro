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
  return isSameEntityFieldValue(undefined, field, left, right)
}

/**
 * Field equality with the entity-specific canonicalizations that affect both
 * restore reconciliation and no-op removal at command issue time.
 */
export function isSameEntityFieldValue(
  entityKey: string | undefined,
  field: string,
  left: unknown,
  right: unknown
): boolean {
  // ZenMoney canonicalizes an empty transaction comment to null.
  if (field === 'comment') return (left ?? '') === (right ?? '')

  // Tag order is presentation only for operations. Reordering the same tags
  // must not turn a semantically matching restored transaction into a write.
  if (entityKey === 'transaction' && field === 'tag') {
    return isSameSet(left, right)
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    return (
      left.length === right.length &&
      left.every((value, index) => Object.is(value, right[index]))
    )
  }
  return Object.is(left, right)
}

function isSameSet(left: unknown, right: unknown): boolean {
  if (left === null || right === null) return left === right
  if (!Array.isArray(left) || !Array.isArray(right)) return false
  if (left.length !== right.length) return false
  const sortedLeft = [...left].sort()
  const sortedRight = [...right].sort()
  return sortedLeft.every((value, index) => value === sortedRight[index])
}
