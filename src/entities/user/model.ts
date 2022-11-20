import { TFxCode, TUserId } from '@shared/types'
import { RootState, useAppSelector } from '@store'
import { instrumentModel } from '@entities/currency/instrument'

const getUsers = (state: RootState) => state.data.current.user

const getRootUser = (state: RootState) => {
  const users = getUsers(state)
  for (const id in users) {
    if (!users[id].parent) return users[id]
  }
  return null
}

const getRootUserId = (state: RootState) =>
  getRootUser(state)?.id || (0 as TUserId)

const getUserInstrumentId = (state: RootState) => getRootUser(state)?.currency

const getUserCurrency = (state: RootState): TFxCode =>
  instrumentModel.getFxIdMap(state)[getUserInstrumentId(state) || 1] // USD as default

export const userModel = {
  getUsers,
  getRootUser,
  getRootUserId,
  getUserInstrumentId,
  getUserCurrency,
  // Hooks
  useRootUserId: () => useAppSelector(getRootUserId),
  useUserCurrency: () => useAppSelector(getUserCurrency),
  useUserInstrumentId: () => useAppSelector(getUserInstrumentId),
}
