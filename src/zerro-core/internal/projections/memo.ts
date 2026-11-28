/** Core's single-entry memo compares dependency identities without importing Redux. */

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

/** Keep the previous ID array when its contents match so unrelated account edits cannot invalidate activity. */
export function sameItems<T>(
  previous: readonly T[],
  next: readonly T[]
): boolean {
  return sameValues(previous, next)
}

export function sameSet<T>(
  previous: ReadonlySet<T>,
  next: ReadonlySet<T>
): boolean {
  if (previous.size !== next.size) return false
  for (const item of next) if (!previous.has(item)) return false
  return true
}

export function sameRecord<T>(
  previous: Readonly<Record<string, T>>,
  next: Readonly<Record<string, T>>
): boolean {
  const keys = Object.keys(next)
  return (
    keys.length === Object.keys(previous).length &&
    keys.every(
      key => Object.hasOwn(previous, key) && previous[key] === next[key]
    )
  )
}
