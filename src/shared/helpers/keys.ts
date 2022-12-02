export function keys<O extends Object>(o: O) {
  return Object.keys(o) as (keyof O)[]
}

type Entries<T> = {
  [K in keyof T]: [K, T[K]]
}[keyof T][]

export function entries<T extends object>(obj: T) {
  return Object.entries(obj) as Entries<T>
}
