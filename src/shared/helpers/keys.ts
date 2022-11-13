export function keys<O extends Object>(o: O) {
  return Object.keys(o) as (keyof O)[]
}
