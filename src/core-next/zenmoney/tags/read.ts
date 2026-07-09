import type { ById } from '../../shared/types'
import type { TDataStore } from '../store'
import type { TTag } from './types'

export function getTags(data: TDataStore): ById<TTag> {
  return data.tag
}
