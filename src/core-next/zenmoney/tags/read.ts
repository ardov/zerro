import type { ById, TDataStore } from '6-shared/types'
import type { TTag } from './types'

export function getTags(data: TDataStore): ById<TTag> {
  return data.tag
}
