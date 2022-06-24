export function keys<O>(o: O) {
  return Object.keys(o) as (keyof O)[]
}
