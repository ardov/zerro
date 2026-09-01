// Internal utility types. Foundation imports no product-domain layer.
import type { TISODate, TISOMonth } from './primitives'

/** Objects stored in a collection by id */
export type ById<T extends { id: string | number }> = Record<T['id'], T>

export type ByMonth<T> = Record<TISOMonth, T>
export type ByDate<T> = Record<TISODate, T>

/** Override properties of T with properties of R */
export type Modify<T, R> = Omit<T, keyof R> & R

/**
 * A discriminator the server owns: one of the values this version knows, or
 * any other string it may introduce. Autocomplete keeps the known values.
 */
export type TOpenEnum<TKnown extends string> = TKnown | (string & {})

/** Sparse writable intent for an entity identified by id. */
export type EntityPatch<
  TEntity extends { id: string | number },
  TWritableFields extends Exclude<keyof TEntity, 'id'>,
> = Pick<TEntity, 'id'> & Partial<Pick<TEntity, TWritableFields>>

/** Make all properties optional except the listed ones */
export type OptionalExceptFor<T, TRequired extends keyof T> = Partial<T> &
  Pick<T, TRequired>
