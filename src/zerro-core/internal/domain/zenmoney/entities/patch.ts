import type { ById } from '../../foundation/types'

type TEntityId = string | number

/**
 * Validates a patch against one normalized entity map without depending on the
 * later aggregate model. Entity compilers return their own narrow patch shape;
 * `model/store.ts` aggregates those shapes into `TIntentPatch`.
 */
export function compileExistingEntityPatch<
  TKey extends string,
  TEntity extends { id: TEntityId },
  TPatch extends { id: TEntityId },
>(
  byId: ById<TEntity>,
  key: TKey,
  patch: TPatch | TPatch[]
): Record<TKey, TPatch[]> {
  const list = Array.isArray(patch) ? patch : [patch]

  list.forEach(item => {
    if (!item.id) throw new Error(`Trying to patch ${key} without id`)
    if (!(byId as Record<TEntityId, TEntity>)[item.id]) {
      throw new Error(`${capitalize(key)} not found`)
    }
  })

  return { [key]: list } as Record<TKey, TPatch[]>
}

function capitalize(value: string): string {
  return value[0].toUpperCase() + value.slice(1)
}
