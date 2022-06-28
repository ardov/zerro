import { makeAccount } from 'models/account'
import { makeReminder } from 'models/reminder'
import { DataReminderType, DATA_ACC_NAME } from './constants'
import { TAccount } from 'shared/types'

// DATA ACCOUNT
export function makeDataAcc(user: number): TAccount {
  return makeAccount({
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
