import type { TISODate, TISOMonth } from './primitives'

export type ById<T extends { id: string | number }> = Record<T['id'], T>

export type ByMonth<T> = Record<TISOMonth, T>
export type ByDate<T> = Record<TISODate, T>

export type Modify<T, R> = Omit<T, keyof R> & R

/** Allow strings the server may introduce while keeping autocomplete for known values. */
export type TOpenEnum<TKnown extends string> = TKnown | (string & {})

export type EntityPatch<
  TEntity extends { id: string | number },
  TWritableFields extends Exclude<keyof TEntity, 'id'>,
> = Pick<TEntity, 'id'> & Partial<Pick<TEntity, TWritableFields>>

export type OptionalExceptFor<T, TRequired extends keyof T> = Partial<T> &
  Pick<T, TRequired>
