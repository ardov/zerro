import {
  applyPatch,
  dataEntityKeys,
  type TDataEntityKey,
  type TDataStore,
} from '../../domain/zenmoney'
export type TCompactDeletion = {
  object: TDataEntityKey
  id: string | number
}

export type TCompactEntityChange = {
  id: string | number
  fields: Record<string, unknown>
  remove?: string[]
}

export type TCompactCanonicalTransition = {
  serverTimestamp?: number
  upsert?: Partial<Record<TDataEntityKey, TCompactEntityChange[]>>
  deletion?: TCompactDeletion[]
}

type TEntityRecord = {
  id: string | number
  [field: string]: unknown
}

type TEntityMap = Record<string, TEntityRecord | undefined>

export function compactCanonicalTransition(
  before: TDataStore,
  after: TDataStore
): TCompactCanonicalTransition | undefined {
  const transition: TCompactCanonicalTransition = {}

  if (!Object.is(before.serverTimestamp, after.serverTimestamp)) {
    transition.serverTimestamp = after.serverTimestamp
  }

  const upsert: Partial<Record<TDataEntityKey, TCompactEntityChange[]>> = {}
  const deletion: TCompactDeletion[] = []

  dataEntityKeys.forEach(object => {
    const beforeById = getEntityMap(before, object)
    const afterById = getEntityMap(after, object)
    const changes: TCompactEntityChange[] = []
    const ids = new Set([...Object.keys(beforeById), ...Object.keys(afterById)])

    ids.forEach(idKey => {
      const beforeEntity = beforeById[idKey]
      const afterEntity = afterById[idKey]

      if (!afterEntity) {
        if (beforeEntity) deletion.push({ object, id: beforeEntity.id })
        return
      }

      if (!beforeEntity) {
        changes.push({
          id: afterEntity.id,
          fields: withoutId(afterEntity),
        })
        return
      }

      const fields: Record<string, unknown> = {}
      const remove: string[] = []

      Object.keys(afterEntity).forEach(field => {
        if (
          field !== 'id' &&
          !deepEqual(beforeEntity[field], afterEntity[field])
        )
          fields[field] = afterEntity[field]
      })
      Object.keys(beforeEntity).forEach(field => {
        if (field !== 'id' && !(field in afterEntity)) remove.push(field)
      })

      if (Object.keys(fields).length || remove.length) {
        changes.push({
          id: afterEntity.id,
          fields,
          ...(remove.length ? { remove } : {}),
        })
      }
    })

    if (changes.length) upsert[object] = changes
  })

  if (Object.keys(upsert).length) transition.upsert = upsert
  if (deletion.length) transition.deletion = deletion

  return Object.keys(transition).length ? transition : undefined
}

export function applyCompactTransition(
  base: TDataStore,
  transition: TCompactCanonicalTransition
): TDataStore {
  const next = applyPatch(base, {
    serverTimestamp: transition.serverTimestamp,
  })
  const mutableNext = next as unknown as Record<TDataEntityKey, TEntityMap>
  const touched = new Set<TDataEntityKey>()

  transition.deletion?.forEach(item => touched.add(item.object))
  Object.keys(transition.upsert ?? {}).forEach(object =>
    touched.add(object as TDataEntityKey)
  )
  touched.forEach(object => {
    mutableNext[object] = { ...getEntityMap(next, object) }
  })

  transition.deletion?.forEach(({ object, id }) => {
    delete getEntityMap(next, object)[id]
  })

  Object.entries(transition.upsert ?? {}).forEach(([object, changes]) => {
    if (!changes) return
    const entityMap = getEntityMap(next, object as TDataEntityKey)

    changes.forEach(change => {
      const previous = entityMap[change.id]
      const entity: TEntityRecord = previous
        ? { ...previous }
        : { id: change.id }
      change.remove?.forEach(field => delete entity[field])
      Object.assign(entity, change.fields)
      entityMap[change.id] = entity
    })
  })

  return next
}

function getEntityMap(store: TDataStore, object: TDataEntityKey): TEntityMap {
  return store[object] as TEntityMap
}

function withoutId(entity: TEntityRecord): Record<string, unknown> {
  const fields: Record<string, unknown> = {}
  Object.keys(entity).forEach(field => {
    if (field !== 'id') fields[field] = entity[field]
  })
  return fields
}

function deepEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true
  if (typeof left !== 'object' || typeof right !== 'object') return false
  if (left === null || right === null) return false

  const leftIsArray = Array.isArray(left)
  if (leftIsArray !== Array.isArray(right)) return false
  if (leftIsArray) {
    const rightArray = right as unknown[]
    const leftArray = left as unknown[]
    return (
      leftArray.length === rightArray.length &&
      leftArray.every((value, index) => deepEqual(value, rightArray[index]))
    )
  }

  const leftRecord = left as Record<string, unknown>
  const rightRecord = right as Record<string, unknown>
  const leftKeys = Object.keys(leftRecord)
  const rightKeys = Object.keys(rightRecord)
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every(
      key =>
        Object.prototype.hasOwnProperty.call(rightRecord, key) &&
        deepEqual(leftRecord[key], rightRecord[key])
    )
  )
}
