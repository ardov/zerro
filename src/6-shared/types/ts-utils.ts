import type { TISODate, TISOMonth } from './types'

export type ByIdOld<T> = { [id: string]: T }
export type ById<T extends { id: string | number }> = Record<T['id'], T>

export type ByMonth<T> = Record<TISOMonth, T>
export type ByDate<T> = Record<TISODate, T>

export type Modify<T, R> = Omit<T, keyof R> & R

export type OptionalExceptFor<T, TRequired extends keyof T> = Partial<T> &
  Pick<T, TRequired>
