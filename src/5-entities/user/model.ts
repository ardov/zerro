import { TFxCode, TUserId } from '6-shared/types'
import { RootState } from 'store'
import { getInstCodeMap } from '5-entities/currency/instrument/model'

export const getUsers = (state: RootState) => state.data.current.user

export const getRootUser = (state: RootState) => {
  const users = getUsers(state)
  for (const id in users) {
    if (!users[id].parent) return users[id]
  }
  return null
}

export const getRootUserId = (state: RootState) =>
  getRootUser(state)?.id || (0 as TUserId)

export const getUserInstrumentId = (state: RootState) =>
  getRootUser(state)?.currency

export const getUserCurrency = (state: RootState): TFxCode => {
  const userInstrument = getUserInstrumentId(state)
  if (typeof userInstrument !== 'number') return 'USD'
  return getInstCodeMap(state)[userInstrument]
}
