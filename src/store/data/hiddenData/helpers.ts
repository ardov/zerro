import { makeAccount } from 'store/data/accounts/helpers'
import { makeReminder } from 'store/data/reminders/helpers'
import { DataReminderType, DATA_ACC_NAME } from './constants'
import { TRawAccount } from 'shared/types'

// DATA ACCOUNT
export function makeDataAcc(user: number): TRawAccount {
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
    startDate: +new Date(2020, 0, 1),
    endDate: +new Date(2020, 0, 1),
    payee: type,
    comment: JSON.stringify(data),
  })
}
