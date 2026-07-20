/**
 * Single-entry memos keyed on dependencies compared by identity — the same
 * contract as reselect's default, minus the dependency.
 *
 * Core cannot import `@reduxjs/toolkit` (see api-boundary.test.ts), and a
 * standalone package should not pull in Redux just to cache a projection. The
 * same primitive serves both runtimes: in Redux the deps change between
 * snapshots, in a snapshot session they are constant, so the entry always hits.
 *
 * Two shapes over one core:
 * - `memoOn` takes a dependency tuple and spreads it into a positional compute;
 * - `memoOnObject` takes a named-dependency object and passes it straight to an
 *   object-parameter compute, so the compute can be a bare `build*` function
 *   and each dependency is named once, by key rather than by position.
 */

/** Tuple deps → positional compute. */
export function memoOn<TInput, TDeps extends readonly unknown[], TResult>(
  selectDeps: (input: TInput) => readonly [...TDeps],
  compute: (...deps: TDeps) => TResult,
  isEqualResult?: (previous: TResult, next: TResult) => boolean
): (input: TInput) => TResult {
  return makeMemo(
    selectDeps,
    deps => deps,
    deps => compute(...deps),
    isEqualResult
  )
}

/** Named-dependency object → object-parameter compute. */
export function memoOnObject<
  TInput,
  TArg extends Record<string, unknown>,
  TResult,
>(
  selectArg: (input: TInput) => TArg,
  compute: (arg: TArg) => TResult,
  isEqualResult?: (previous: TResult, next: TResult) => boolean
): (input: TInput) => TResult {
  return makeMemo(selectArg, Object.values, compute, isEqualResult)
}

function makeMemo<TInput, TDeps, TResult>(
  selectDeps: (input: TInput) => TDeps,
  depValues: (deps: TDeps) => readonly unknown[],
  compute: (deps: TDeps) => TResult,
  isEqualResult?: (previous: TResult, next: TResult) => boolean
): (input: TInput) => TResult {
  let hasValue = false
  let lastValues: readonly unknown[] = []
  let lastResult: TResult

  return input => {
    const deps = selectDeps(input)
    const values = depValues(deps)
    if (hasValue && sameValues(lastValues, values)) return lastResult

    const result = compute(deps)
    lastValues = values
    if (hasValue && isEqualResult?.(lastResult, result)) return lastResult

    lastResult = result
    hasValue = true
    return result
  }
}

function sameValues(
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
  return sameValues(previous, next)
}
