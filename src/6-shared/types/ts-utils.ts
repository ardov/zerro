import { TISODate, TISOMonth } from './types'

/** Objects stored in collection by id */
export type ByIdOld<T> = { [id: string]: T }
export type ById<T extends { id: string | number }> = Record<T['id'], T>

export type ByMonth<T> = Record<TISOMonth, T>
export type ByDate<T> = Record<TISODate, T>

/** Edit type */
export type Modify<T, R> = Omit<T, keyof R> & R

/** Make all properties otional except some lited ones */
export type OptionalExceptFor<T, TRequired extends keyof T> = Partial<T> &
  Pick<T, TRequired>
