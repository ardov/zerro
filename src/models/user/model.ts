import { RootState } from '@store'

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
