import {
  intentEntityKeys,
  intentPatchKeys,
  dataEntityKeys,
  type TDataStore,
  type TIntentPatch,
  type TIntentEntityKey,
  type TDataEntityKey,
} from './model/store'

export type TEntityOperation =
  | {
      [K in TIntentEntityKey]: {
        type: `${K}.create` | `${K}.patch`
        value: NonNullable<TIntentPatch[K]>[number]
      }
    }[TIntentEntityKey]
  | { type: 'entity.delete'; entity: TDataEntityKey; id: string | number }

/** Entity builders produce sparse fields; preparation fixes create versus edit. */
export function entityOperations(
  snapshot: TDataStore,
  patch: TIntentPatch
): TEntityOperation[] {
  for (const key of Object.keys(patch)) {
    if (
      key !== 'serverTimestamp' &&
      !(intentPatchKeys as readonly string[]).includes(key)
    )
      throw new Error(`Unsupported command intent: ${key}`)
  }
  return [
    ...intentEntityKeys.flatMap(key =>
      (patch[key] ?? []).map(
        value =>
          ({
            type: `${key}.${snapshot[key][value.id as never] ? 'patch' : 'create'}`,
            value,
          }) as TEntityOperation
      )
    ),
    ...(patch.deletion ?? []).map(({ object, id }) => ({
      type: 'entity.delete' as const,
      entity: object,
      id,
    })),
  ]
}

export function entityOperationTarget(operation: TEntityOperation) {
  return operation.type === 'entity.delete'
    ? { key: operation.entity, id: operation.id, deletion: true }
    : {
        key: operation.type.split('.')[0] as TIntentEntityKey,
        id: operation.value.id,
        deletion: false,
      }
}

export function entityOperationPatch(
  operation: TEntityOperation
): TIntentPatch {
  if (operation.type === 'entity.delete')
    return { deletion: [{ object: operation.entity, id: operation.id }] }
  return { [operation.type.split('.')[0]]: [operation.value] }
}

export function isEntityOperation(value: {
  type: string
}): value is TEntityOperation {
  return (
    value.type === 'entity.delete' ||
    intentEntityKeys.some(
      key => value.type === `${key}.create` || value.type === `${key}.patch`
    )
  )
}

export function validateEntityOperation(value: TEntityOperation): void {
  if (
    value.type !== 'entity.delete' &&
    (!value.value ||
      typeof value.value !== 'object' ||
      Array.isArray(value.value))
  )
    throw new Error('Invalid entity fields')
  const target = entityOperationTarget(value)
  if (
    !dataEntityKeys.includes(target.key) ||
    !(
      (typeof target.id === 'string' && target.id.length > 0) ||
      (typeof target.id === 'number' && Number.isFinite(target.id))
    )
  )
    throw new Error('Invalid entity operation')
}
