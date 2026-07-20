/**
 * Single-entry memo keyed on a dependency tuple compared by identity — the
 * same contract as reselect's default, minus the dependency.
 *
 * Core cannot import `@reduxjs/toolkit` (see api-boundary.test.ts), and a
 * standalone package should not pull in Redux just to cache a projection. The
 * same primitive serves both runtimes: in Redux the deps change between
 * snapshots, in a snapshot session they are constant, so the entry always hits.
 */
export function memoOn<TInput, TDeps extends readonly unknown[], TResult>(
  selectDeps: (input: TInput) => readonly [...TDeps],
  compute: (...deps: TDeps) => TResult,
  isEqualResult?: (previous: TResult, next: TResult) => boolean
): (input: TInput) => TResult {
  let hasValue = false
  let lastDeps: readonly unknown[] = []
  let lastResult: TResult

  return input => {
    const deps = selectDeps(input)
    if (hasValue && sameDeps(lastDeps, deps)) return lastResult

    const result = compute(...deps)
    lastDeps = deps
    if (hasValue && isEqualResult?.(lastResult, result)) return lastResult

    lastResult = result
    hasValue = true
    return result
  }
}

function sameDeps(
  previous: readonly unknown[],
  next: readonly unknown[]
): boolean {
  if (previous.length !== next.length) return false
  return previous.every((value, index) => Object.is(value, next[index]))
}

/**
 * Result equality for nodes that rebuild an id list from a wider entity map.
 * Keeps the previous array when the ids did not actually change, so editing an
 * unrelated field of one account does not invalidate the activity chain.
 */
export function sameItems<T>(
  previous: readonly T[],
  next: readonly T[]
): boolean {
  return sameDeps(previous, next)
}
