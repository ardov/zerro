// Internal utility types. Not part of the public Zerro Core API.
import type { TISODate, TISOMonth } from '../zenmoney/primitives'

/** Objects stored in a collection by id */
export type ById<T extends { id: string | number }> = Record<T['id'], T>

export type ByMonth<T> = Record<TISOMonth, T>
export type ByDate<T> = Record<TISODate, T>

/** Override properties of T with properties of R */
export type Modify<T, R> = Omit<T, keyof R> & R

/** Make all properties optional except the listed ones */
export type OptionalExceptFor<T, TRequired extends keyof T> = Partial<T> &
  Pick<T, TRequired>
