import { makeAccount } from 'store/localData/accounts/helpers'
import { makeReminder } from 'store/localData/reminders/helpers'
import { DATA_ACC_NAME } from './constants'

// DATA ACCOUNT
export function makeDataAcc(user) {
  return makeAccount({
    user,
    instrument: 2,
    title: DATA_ACC_NAME,
    archive: true,
  })
}

// DATA REMINDER
export function makeDataReminder(
  user,
  account,
  type = DATA_ACC_NAME,
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
