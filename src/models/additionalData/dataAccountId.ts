import { DATA_ACC_NAME } from 'models/hiddenData/constants'
import { ById, TAccount } from 'shared/types'

/**
 *  This is helper account which is used to store reminders with hidden data.
 *  We need this one to be able easily delete all zerro reminders.
 * */
export const getDataAccId = (accounts: ById<TAccount>) => {
  const dataAcc = Object.values(accounts).find(
    account => account.title === DATA_ACC_NAME
  )
  if (!dataAcc) return null
  return dataAcc.id
}
