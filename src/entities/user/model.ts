import { TFxCode } from '@shared/types'
import { RootState, useAppSelector } from '@store'
import { instrumentModel } from '@entities/instrument'

export const getUsers = (state: RootState) => state.data.current.user

export const getRootUser = (state: RootState) => {
  const users = getUsers(state)
  for (const id in users) {
    if (!users[id].parent) return users[id]
  }
  return null
}

export const getUserInstrumentId = (state: RootState) =>
  getRootUser(state)?.currency

export const getUserCurrency = (state: RootState): TFxCode =>
  instrumentModel.getFxIdMap(state)[getUserInstrumentId(state) || 1] // USD as default

export const userModel = {
  getUsers,
  getRootUser,
  getUserInstrumentId,
  getUserCurrency,
  useUserCurrency: () => useAppSelector(getUserCurrency),
  useUserInstrumentId: () => useAppSelector(getUserInstrumentId),
}
