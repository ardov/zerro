import type {
  TFxCode,
  TDataStore,
  TInstrumentId,
  TUser,
  TUserId,
} from '6-shared/types'
import { getInstrumentCode } from '../instruments'

export function getRootUser(data: TDataStore): TUser | null {
  for (const id in data.user) {
    if (!data.user[id].parent) return data.user[id]
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
  return getInstrumentCode(data, instrumentId) || 'USD'
}
