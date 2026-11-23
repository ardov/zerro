/** Structural equality for plain, acyclic JSON-like values. Use it for Redux projections that rebuild references. */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true

  if (typeof a !== 'object' || typeof b !== 'object') return false
  if (a === null || b === null) return false

  const aIsArray = Array.isArray(a)
  if (aIsArray !== Array.isArray(b)) return false

  if (aIsArray) {
    const arrB = b as unknown[]
    if (a.length !== arrB.length) return false
    return a.every((item, index) => deepEqual(item, arrB[index]))
  }

  const objA = a as Record<string, unknown>
  const objB = b as Record<string, unknown>
  const keysA = Object.keys(objA)
  if (keysA.length !== Object.keys(objB).length) return false

  return keysA.every(
    key =>
      Object.prototype.hasOwnProperty.call(objB, key) &&
      deepEqual(objA[key], objB[key])
  )
}
