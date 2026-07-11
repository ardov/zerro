import type { ById } from '../../shared/types'
import type { TDataStore } from '../store'
import {
  getInstCodeMap,
  type TFxCode,
  type TInstrumentId,
} from '../instruments'
import type { TUser, TUserId } from './types'

export type TUserSource = Pick<TDataStore, 'user' | 'instrument'>

export function getUsers(data: TUserSource): ById<TUser> {
  return data.user
}

export function getRootUser(data: TUserSource): TUser | null {
  const users = getUsers(data)
  for (const id in users) {
    if (!users[id].parent) return users[id]
  }
  return null
}

export function getRootUserId(data: TUserSource): TUserId | null {
  return getRootUser(data)?.id || null
}

export function getUserInstrumentId(data: TUserSource): TInstrumentId | null {
  return getRootUser(data)?.currency || null
}

export function getUserCurrency(data: TUserSource): TFxCode {
  const instrumentId = getUserInstrumentId(data)
  if (typeof instrumentId !== 'number') return 'USD'
  return getInstCodeMap(data)[instrumentId] || 'USD'
}
