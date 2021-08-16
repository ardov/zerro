import { Diff, User, ZmCompany, ZmCountry, ZmInstrument } from 'types'
import countries from './countries.json'
import companies from './companies.json'
import instruments from './instruments.json'
import { makeAccount } from 'store/localData/accounts/helpers'
import { makeTag } from 'store/localData/tags/makeTag'
import makeTransaction from 'store/localData/transactions/makeTransaction'

export const RUB = 2
export const RU = 1

const NOW = Date.now()
const DAY = 1000 * 60 * 60 * 24

const USER: User = {
  id: 777,
  changed: NOW,
  currency: 2, // RUB
  parent: null,
  country: RU,
  countryCode: 'RU',
  email: null,
  login: 'demoAccount',
  monthStartDay: 1,
  paidTill: NOW + DAY * 365,
  subscription: '10yearssubscription',
}

const DEBT_ACC = makeAccount({
  id: 'DEBT_ACC',
  user: USER.id,
  instrument: USER.currency,
  type: 'debt',
  title: 'Долги',
})
const CASH_ACC = makeAccount({
  id: 'CASH_ACC',
  user: USER.id,
  instrument: USER.currency,
  type: 'cash',
  title: 'Наличка',
  startBalance: 0,
})

const CAFE_TAG = makeTag({
  id: 'CAFE_TAG',
  user: USER.id,
  title: 'Кафе',
  showOutcome: true,
})
const SALARY_TAG = makeTag({
  id: 'SALARY_TAG',
  user: USER.id,
  title: 'Кафе',
  showIncome: true,
})

const TR1 = makeTransaction({
  id: 'income',
  user: USER.id,
  date: NOW,
  created: NOW - DAY,
  viewed: true,
  qrCode: null,
  incomeBankID: CASH_ACC.company,
  incomeInstrument: CASH_ACC.instrument,
  incomeAccount: CASH_ACC.id,
  income: 1000,
  outcomeBankID: null,
  outcomeInstrument: CASH_ACC.instrument,
  outcomeAccount: CASH_ACC.id,
  outcome: 0,
  tag: [SALARY_TAG.id],
  merchant: null,
  payee: 'Random Payee',
  comment: 'Зарплата',
})

export const getDemoData = (): Diff => {
  return {
    serverTimestamp: NOW,
    country: countries as ZmCountry[],
    company: companies as ZmCompany[],
    instrument: instruments as ZmInstrument[],

    user: [USER],
    account: [DEBT_ACC, CASH_ACC],
    merchant: [],
    tag: [CAFE_TAG, SALARY_TAG],
    budget: [],
    reminder: [],
    reminderMarker: [],
    transaction: [TR1],
  }
}
