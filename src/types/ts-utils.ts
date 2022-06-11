/** Objects stored in collection by id */
export type ById<T> = { [id: string]: T }

/** Edit type */
export type Modify<T, R> = Omit<T, keyof R> & R

/** Make all properties otional except some lited ones */
export type OptionalExceptFor<T, TRequired extends keyof T> = Partial<T> &
  Pick<T, TRequired>
