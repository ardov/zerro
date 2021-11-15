import { Diff, User, ZmCompany, ZmCountry, ZmInstrument } from 'types'
import countries from './countries.json'
import companies from './companies.json'
import instruments from './instruments.json'
import { makeAccount } from 'store/data/accounts'
import { makeTag } from 'store/data/tags/makeTag'
import makeTransaction from 'store/data/transactions/makeTransaction'

const NOW = Date.now()
const DAY = 1000 * 60 * 60 * 24

const USER: User = {
  id: 777,
  changed: NOW,
  currency: 2, // RUB
  parent: null,
  country: 1, // Russia
  countryCode: 'RU',
  email: null,
  login: 'demoAccount',
  monthStartDay: 1,
  paidTill: NOW + DAY * 365,
  subscription: '10yearssubscription',
}

// ACCOUNTS
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
const account = [DEBT_ACC, CASH_ACC]

// TAGS
const FOOD_TAG = makeTag({
  id: 'FOOD_TAG',
  user: USER.id,
  title: 'Еда',
  showOutcome: true,
})
const CAFE_TAG = makeTag({
  id: 'CAFE_TAG',
  user: USER.id,
  title: 'Кафе',
  parent: FOOD_TAG.id,
  showOutcome: true,
})
const SALARY_TAG = makeTag({
  id: 'SALARY_TAG',
  user: USER.id,
  title: 'Зарплата',
  showIncome: true,
})
const tag = [FOOD_TAG, CAFE_TAG, SALARY_TAG]

// TRANSACTIONS
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
    account,
    merchant: [],
    tag,
    budget: [],
    reminder: [],
    reminderMarker: [],
    transaction: [TR1],
  }
}
