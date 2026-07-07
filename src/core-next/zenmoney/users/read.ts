import type { ById, TDataStore } from '6-shared/types'
import {
  getInstCodeMap,
  type TFxCode,
  type TInstrumentId,
} from '../instruments'
import type { TUser, TUserId } from './types'

export function getUsers(data: TDataStore): ById<TUser> {
  return data.user
}

export function getRootUser(data: TDataStore): TUser | null {
  const users = getUsers(data)
  for (const id in users) {
    if (!users[id].parent) return users[id]
  }
  return null
}

export function getRootUserId(data: TDataStore): TUserId | null {
  return getRootUser(data)?.id || null
}

export function getUserInstrumentId(data: TDataStore): TInstrumentId | null {
  return getRootUser(data)?.currency || null
}

export function getUserCurrency(data: TDataStore): TFxCode {
  const instrumentId = getUserInstrumentId(data)
  if (typeof instrumentId !== 'number') return 'USD'
  return getInstCodeMap(data)[instrumentId] || 'USD'
}
