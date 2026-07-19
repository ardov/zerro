import type { ById } from '../../shared/types'
import {
  getSimpleHiddenData,
  HiddenDataType,
  THiddenDataSource,
} from '../hidden-data'
import type { TEnvelopeMeta } from './types'

export function getEnvelopeMeta(data: THiddenDataSource): ById<TEnvelopeMeta> {
  return getSimpleHiddenData<ById<TEnvelopeMeta>>(
    data,
    HiddenDataType.EnvelopeMeta,
    {}
  )
}
