import countries from './countries.json'
import companies from './companies.json'
import instruments from './instruments.json'
import {
  AccountType,
  TAccountId,
  TDiff,
  TInstrumentId,
  TISODate,
  TTagId,
  TUser,
} from '6-shared/types'
import { accountModel } from '5-entities/account'
import { tagModel } from '5-entities/tag'
import { merchantModel } from '5-entities/merchant'
import { round } from '6-shared/helpers/money'
import { generateTransactions } from './generateTransactions'
import { getColorForString, hex2int } from '6-shared/helpers/color'

/*
Order of creating demo data:
01. instrument
02. country
03. company
04. user
05. merchant
06. account
07. tag
08. budget
09. reminder
10. reminderMarker
11. transaction
*/

const NOW = Date.now()
const MINUTE = 1000 * 60
const HOUR = 1000 * 60 * 60
const DAY = 1000 * 60 * 60 * 24

// Instruments
const USD = 1
const RUB = 2
const EUR = 3

// Countries
const RU = 1
const UA = 2
const DE = 3
const US = 4

// Companies
const CRYSTALBANK = 15638
const DENIZBANK = 15639
const INGROMANIA = 15640
const TALLINNABANK = 15641
const KAPITALBANK = 15642
const BANKOFAMERICA = 15643
const BANKOFCHINA = 15644

// User
const mainUser: TUser = {
  id: 23880,
  changed: NOW,
  currency: RUB,
  parent: null,
  country: RU,
  countryCode: 'RU',
  email: null,
  login: 'demoAccount',
  monthStartDay: 1,
  paidTill: NOW + DAY * 365,
  subscription: '10yearssubscription',
  isForecastEnabled: false,
  planBalanceMode: 'balance',
  planSettings: '',
  subscriptionRenewalDate: NOW + DAY * 365,
}
const users = {
  main: mainUser,
}

// Merchants

function makeMerchants(user: TUser) {
  const makeMerchant = (title: string) =>
    merchantModel.makeMerchant({ id: title, title, user: user.id })

  const merchants = {
    // Grocery stores
    supermarket: makeMerchant('City Supermarket'),
    localStore: makeMerchant('Local Corner Store'),

    // Restaurants & Food
    pizzaPlace: makeMerchant("Mario's Pizza"),
    cafe: makeMerchant('Coffee Bean Cafe'),
    fastFood: makeMerchant('Quick Burger'),

    // Delivery services
    deliveryApp: makeMerchant('FoodDelivery App'),
    pizzaDelivery: makeMerchant('Express Pizza Delivery'),

    // Transportation
    taxiService: makeMerchant('City Taxi'),
    gasStation: makeMerchant('Shell Gas Station'),

    // Shopping
    electronics: makeMerchant('TechWorld Electronics'),
    clothing: makeMerchant('Fashion Outlet'),

    // Bills & Services
    electricCompany: makeMerchant('City Electric Company'),
    internetProvider: makeMerchant('FastNet Internet'),

    // Healthcare
    pharmacy: makeMerchant('HealthPlus Pharmacy'),
    clinic: makeMerchant('City Medical Clinic'),

    // People
    friend: makeMerchant('Alex'),
    mother: makeMerchant('Mother'),
    wife: makeMerchant('Wife'),
  }
  return merchants
}

const merchants = makeMerchants(mainUser)

// Accounts
const makeAccount = (acc: {
  title: string
  instrument: TInstrumentId
  type: AccountType
  inBalance?: boolean
  startBalance?: number
}) =>
  accountModel.makeAccount({
    id: acc.title,
    user: mainUser.id,
    inBalance: true,
    ...acc,
  })

const { Debt, Cash, Ccard } = AccountType

const accounts = {
  debt: makeAccount({
    title: 'Debts',
    instrument: mainUser.currency,
    type: Debt,
  }),
  cashUSD: makeAccount({ title: 'Cash USD', instrument: USD, type: Cash }),
  cashRUB: makeAccount({ title: 'Cash RUB', instrument: RUB, type: Cash }),
  cashEUR: makeAccount({
    title: 'Cash EUR',
    instrument: EUR,
    type: Cash,
    startBalance: 1000,
  }),
  ccardUSD: makeAccount({
    title: 'Credit Card USD',
    instrument: USD,
    type: Ccard,
  }),
  ccardRUB: makeAccount({
    title: 'Credit Card RUB',
    instrument: RUB,
    type: Ccard,
  }),
}

// Tags
const makeTag = (tag: {
  title: string
  parent?: TTagId
  showIncome?: boolean
  showOutcome?: boolean
}) =>
  tagModel.makeTag({
    id: tag.title,
    user: mainUser.id,
    color: hex2int(getColorForString(tag.title)),
    ...tag,
  })

const tags = {
  // Income
  salary: makeTag({ title: 'Salary', showIncome: true }),
  freelance: makeTag({ title: 'Freelance', showIncome: true }),
  gifts: makeTag({ title: 'Gifts', showIncome: true }),

  // Outcome
  food: makeTag({ title: 'Food', showOutcome: true }),
  transportation: makeTag({ title: 'Transportation', showOutcome: true }),
  entertainment: makeTag({ title: 'Entertainment', showOutcome: true }),
  shopping: makeTag({ title: 'Shopping', showOutcome: true }),
  health: makeTag({ title: 'Health', showOutcome: true }),
  bills: makeTag({ title: 'Bills', showOutcome: true }),
  other: makeTag({ title: 'Other', showOutcome: true }),

  // Adjustment
  adjustment: makeTag({
    title: 'Adjustment',
    showIncome: true,
    showOutcome: true,
  }),
}

const tagsChildren = {
  // Transportation
  publicTransport: makeTag({
    title: 'Public Transport',
    parent: tags.transportation.id,
    showOutcome: true,
  }),
  gas: makeTag({
    title: 'Gas',
    parent: tags.transportation.id,
    showOutcome: true,
  }),
  taxi: makeTag({
    title: 'Taxi',
    parent: tags.transportation.id,
    showOutcome: true,
  }),

  // Food
  groceries: makeTag({
    title: 'Groceries',
    parent: tags.food.id,
    showOutcome: true,
  }),
  restaurant: makeTag({
    title: 'Restaurant',
    parent: tags.food.id,
    showOutcome: true,
  }),
  delivery: makeTag({
    title: 'Delivery',
    parent: tags.food.id,
    showOutcome: true,
  }),

  // Bills
  rent: makeTag({
    title: 'Rent',
    parent: tags.bills.id,
    showOutcome: true,
  }),
  electricity: makeTag({
    title: 'Electricity',
    parent: tags.bills.id,
    showOutcome: true,
  }),
  internet: makeTag({
    title: 'Internet',
    parent: tags.bills.id,
    showOutcome: true,
  }),
}

// Budgets
// skip for now

// Reminders
// skip for now

// ReminderMarkers
// skip for now

// Transactions
const since: TISODate = '2019-01-01'

const transactions = [
  // Salary transactions
  ...generateTransactions({
    pattern: { since, repeat: 'monthly', every: 1, offset: 5 },
    user: mainUser.id,
    tag: [[tags.salary.id]],
    income: 200_000,
    incomeAccount: accounts.ccardRUB,
    comment: 'Regular salary',
  }),

  // Freelance transactions
  ...generateTransactions({
    pattern: { since, repeat: 'monthly', every: 3, offset: 15 },
    user: mainUser.id,
    tag: [[tags.freelance.id]],
    income: 50_000,
    incomeAccount: accounts.cashRUB,
  }),

  // Birthday Gifts
  ...generateTransactions({
    pattern: { since, repeat: 'monthly', every: 12, offset: 340 },
    user: mainUser.id,
    tag: [[tags.gifts.id]],
    income: [100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650],
    incomeAccount: accounts.cashUSD,
    merchant: merchants.wife.id,
    comment: 'Birthday gift',
  }),

  // Public Transport
  ...generateTransactions({
    pattern: { since, repeat: 'daily', every: 1, offset: 1 },
    user: mainUser.id,
    tag: [[tagsChildren.publicTransport.id]],
    outcome: [45, 50, 55],
    outcomeAccount: accounts.cashRUB,
    comment: 'Metro/Bus fare',
  }),

  // Groceries transactions
  ...generateTransactions({
    pattern: { since, repeat: 'daily', every: 4, offset: 1 },
    user: mainUser.id,
    tag: [[tagsChildren.groceries.id]],
    outcome: [1000, 5160, 2715, 11345, 816, 3190, 800, 5000, 5500],
    merchant: merchants.supermarket.id,
    outcomeAccount: accounts.ccardRUB,
  }),
  ...generateTransactions({
    pattern: { since, repeat: 'daily', every: 2, offset: 2 },
    user: mainUser.id,
    tag: [[tagsChildren.groceries.id]],
    outcome: [420.5, 100.32, 816, 800, 5000, 550],
    merchant: merchants.localStore.id,
    outcomeAccount: accounts.cashRUB,
  }),

  // Delivery transactions
  ...generateTransactions({
    pattern: { since, repeat: 'daily', every: 8, offset: 1 },
    user: mainUser.id,
    tag: [[tagsChildren.delivery.id]],
    outcome: [1630, 3560, 2581, 3000, 1729, 1000],
    merchant: merchants.deliveryApp.id,
    outcomeAccount: accounts.ccardRUB,
    comment: 'Food delivery',
  }),
  ...generateTransactions({
    pattern: { since, repeat: 'daily', every: 12, offset: 3 },
    user: mainUser.id,
    tag: [[tagsChildren.delivery.id]],
    outcome: [1200, 1800, 2400],
    merchant: merchants.pizzaDelivery.id,
    outcomeAccount: accounts.ccardRUB,
    comment: 'Pizza delivery',
  }),

  // Restaurant transactions
  ...generateTransactions({
    pattern: { since, repeat: 'daily', every: 7, offset: 2 },
    user: mainUser.id,
    tag: [[tagsChildren.restaurant.id]],
    outcome: [2500, 3200, 4100, 1800, 5500],
    merchant: merchants.pizzaPlace.id,
    outcomeAccount: accounts.ccardRUB,
    comment: 'Dinner out',
  }),
  ...generateTransactions({
    pattern: { since, repeat: 'daily', every: 5, offset: 4 },
    user: mainUser.id,
    tag: [[tagsChildren.restaurant.id]],
    outcome: [450, 620, 380, 720],
    merchant: merchants.cafe.id,
    outcomeAccount: accounts.cashRUB,
    comment: 'Coffee & snacks',
  }),
  ...generateTransactions({
    pattern: { since, repeat: 'daily', every: 14, offset: 6 },
    user: mainUser.id,
    tag: [[tagsChildren.restaurant.id]],
    outcome: [850, 1200, 950],
    merchant: merchants.fastFood.id,
    outcomeAccount: accounts.ccardRUB,
    comment: 'Quick lunch',
  }),

  // Transportation
  ...generateTransactions({
    pattern: { since, repeat: 'daily', every: 10, offset: 3 },
    user: mainUser.id,
    tag: [[tagsChildren.taxi.id]],
    outcome: [300, 450, 600, 750, 900],
    merchant: merchants.taxiService.id,
    outcomeAccount: accounts.cashRUB,
    comment: 'Taxi ride',
  }),
  ...generateTransactions({
    pattern: { since, repeat: 'daily', every: 7, offset: 5 },
    user: mainUser.id,
    tag: [[tagsChildren.gas.id]],
    outcome: [2000, 2500, 3000, 3500],
    merchant: merchants.gasStation.id,
    outcomeAccount: accounts.ccardRUB,
    comment: 'Gas refill',
  }),

  // Shopping
  ...generateTransactions({
    pattern: { since, repeat: 'monthly', every: 2, offset: 20 },
    user: mainUser.id,
    tag: [[tags.shopping.id]],
    outcome: [15000, 25000, 8000, 45000, 12000],
    merchant: merchants.electronics.id,
    outcomeAccount: accounts.ccardRUB,
    comment: 'Electronics purchase',
  }),
  ...generateTransactions({
    pattern: { since, repeat: 'monthly', every: 1, offset: 25 },
    user: mainUser.id,
    tag: [[tags.shopping.id]],
    outcome: [3500, 5200, 7800, 2100, 4600],
    merchant: merchants.clothing.id,
    outcomeAccount: accounts.ccardRUB,
    comment: 'Clothing',
  }),

  // Bills
  ...generateTransactions({
    pattern: { since, repeat: 'monthly', every: 1, offset: 10 },
    user: mainUser.id,
    tag: [[tagsChildren.electricity.id]],
    outcome: [2500, 3200, 2800, 3500, 4100],
    merchant: merchants.electricCompany.id,
    outcomeAccount: accounts.ccardRUB,
    comment: 'Electricity bill',
  }),
  ...generateTransactions({
    pattern: { since, repeat: 'monthly', every: 1, offset: 15 },
    user: mainUser.id,
    tag: [[tagsChildren.internet.id]],
    outcome: [1200],
    merchant: merchants.internetProvider.id,
    outcomeAccount: accounts.ccardRUB,
    comment: 'Internet subscription',
  }),
  ...generateTransactions({
    pattern: { since, repeat: 'monthly', every: 1, offset: 3 },
    user: mainUser.id,
    tag: [[tagsChildren.rent.id]],
    outcome: [35000],
    outcomeAccount: accounts.ccardRUB,
    comment: 'Monthly rent',
  }),

  // Healthcare
  ...generateTransactions({
    pattern: { since, repeat: 'monthly', every: 3, offset: 18 },
    user: mainUser.id,
    tag: [[tags.health.id]],
    outcome: [850, 1200, 650, 2100],
    merchant: merchants.pharmacy.id,
    outcomeAccount: accounts.cashRUB,
    comment: 'Medicine',
  }),
  ...generateTransactions({
    pattern: { since, repeat: 'monthly', every: 6, offset: 25 },
    user: mainUser.id,
    tag: [[tags.health.id]],
    outcome: [3500, 5000, 7500],
    merchant: merchants.clinic.id,
    outcomeAccount: accounts.ccardRUB,
    comment: 'Medical checkup',
  }),

  // Entertainment
  ...generateTransactions({
    pattern: { since, repeat: 'daily', every: 15, offset: 8 },
    user: mainUser.id,
    tag: [[tags.entertainment.id]],
    outcome: [1500, 2200, 3000, 1800],
    outcomeAccount: accounts.ccardRUB,
    comment: 'Movies/Entertainment',
  }),

  // Personal transfers (friends/family)
  ...generateTransactions({
    pattern: { since, repeat: 'monthly', every: 3, offset: 12 },
    user: mainUser.id,
    tag: [[tags.other.id]],
    outcome: [5000, 8000, 3000],
    merchant: merchants.friend.id,
    outcomeAccount: accounts.cashRUB,
    comment: 'Loan to friend',
  }),
  ...generateTransactions({
    pattern: { since, repeat: 'monthly', every: 4, offset: 8 },
    user: mainUser.id,
    tag: [[tags.gifts.id]],
    outcome: [2500, 4000, 6000],
    merchant: merchants.mother.id,
    outcomeAccount: accounts.cashRUB,
    comment: 'Gift for mother',
  }),
]

// ---------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------

function updateBalances(diff: TDiff) {
  const totals: Record<TAccountId, number> = {}
  diff.account?.forEach(acc => (totals[acc.id] = acc.balance))
  diff.transaction?.forEach(tr => {
    if (tr.income) totals[tr.incomeAccount] += tr.income
    if (tr.outcome) totals[tr.outcomeAccount] -= tr.outcome
  })
  diff.account?.forEach(acc => (acc.balance = round(totals[acc.id])))
}

export function getDemoData(): TDiff {
  const diff: TDiff = {
    serverTimestamp: Date.now(),
    instrument: instruments,
    country: countries,
    company: companies,
    user: Object.values(users),
    merchant: Object.values(merchants),
    account: Object.values(accounts),
    tag: Object.values(tags).concat(Object.values(tagsChildren)),
    budget: [],
    reminder: [],
    reminderMarker: [],
    transaction: transactions,
  }
  updateBalances(diff)
  console.log('transactions count: ', diff.transaction?.length)
  return diff
}
