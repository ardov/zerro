/**
 * Structural equality for JSON-like values: primitives, arrays, and plain
 * objects.
 *
 * Used as a Redux selector equality function, where selectors rebuild plain
 * projections on every state change and reference equality would re-render
 * on data that did not actually change.
 *
 * Not a general-purpose deep equal: Map, Set, Date, RegExp, and class
 * instances are compared as plain objects, and cyclic input overflows the
 * stack. Selector projections in this codebase are plain data.
 */
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
