import { accountModel } from '5-entities/account'
import { makeReminder } from '5-entities/reminder'
import { TAccount } from '6-shared/types'
import { DataReminderType, DATA_ACC_NAME } from './constants'

// DATA ACCOUNT
export function makeDataAcc(user: number): TAccount {
  return accountModel.makeAccount({
    user,
    instrument: 2,
    title: DATA_ACC_NAME,
    archive: true,
  })
}

// DATA REMINDER
export function makeDataReminder(
  user: number,
  account: string,
  type: DataReminderType,
  data = ''
) {
  return makeReminder({
    user,
    incomeAccount: account,
    outcomeAccount: account,
    income: 1,
    startDate: '2020-01-01',
    endDate: '2020-01-01',
    payee: type,
    comment: JSON.stringify(data),
  })
}
