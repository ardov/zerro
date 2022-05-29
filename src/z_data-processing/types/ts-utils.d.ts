export type ById<T> = { [id: string]: T }
export type Modify<T, R> = Omit<T, keyof R> & R
export type OptionalExceptFor<T, TRequired extends keyof T> = Partial<T> &
  Pick<T, TRequired>
