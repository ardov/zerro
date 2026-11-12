/** The value after `current`, going round to the first one. */
export function cycle<T>(list: readonly T[], current: T): T {
  return list[(list.indexOf(current) + 1) % list.length]
}
