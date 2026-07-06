import type { ById, TDataStore } from '6-shared/types'
import type { TTag, TTagId } from './types'

export function getTags(data: TDataStore): ById<TTag> {
  return data.tag
}

export function getTag(data: TDataStore, id: TTagId): TTag | null {
  return getTags(data)[id] || null
}
