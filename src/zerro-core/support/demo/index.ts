import countries from './countries.json'
import companies from './companies.json'
import instruments from './instruments.json'
import type { ById } from '../../internal/domain/foundation/types'
import { toISODate } from '../../internal/domain/foundation/date'
import { round } from '../../internal/domain/foundation/numbers'
import { generateTransactions } from './generateTransactions'
import type { TTagIconId } from '../../runtime/presentation/tag-icons'
import {
  AccountType,
  makeAccount as makeCoreAccount,
  type TAccountId,
} from '../../internal/domain/zenmoney/entities/accounts'
import { makeMerchant as makeCoreMerchant } from '../../internal/domain/zenmoney/entities/merchants'
import {
  makeTag as makeCoreTag,
  type TTagId,
} from '../../internal/domain/zenmoney/entities/tags'
import type { TInstrumentId } from '../../internal/domain/zenmoney/entities/instruments'
import type { TUser } from '../../internal/domain/zenmoney/entities/users'
import type { TISODate } from '../../internal/domain/foundation/primitives'
import type {
  TDataStore,
  TNormalizedPatch,
} from '../../internal/domain/zenmoney/model/store'
import { hex2int } from '../../internal/domain/zenmoney/model/color'
import { getColorForString } from '../../runtime/presentation/colors'

const since: TISODate = '2022-06-19'
const defaultDemoNow = Date.parse('2026-07-06T12:00:00.000Z')
const defaultDemoUntil: TISODate = '2026-07-06'

export type TDemoDataOptions = {
  now?: number | Date | string
  until?: TISODate
  scale?: number
}

function updateBalances(diff: TNormalizedPatch) {
  const totals: Record<TAccountId, number> = {}
  diff.account?.forEach(acc => (totals[acc.id] = acc.balance))
  diff.transaction?.forEach(tr => {
    if (tr.income && tr.incomeAccount) totals[tr.incomeAccount] += tr.income
    if (tr.outcome && tr.outcomeAccount) totals[tr.outcomeAccount] -= tr.outcome
  })
  diff.account?.forEach(acc => (acc.balance = round(totals[acc.id])))
}

export function getDemoData(options: TDemoDataOptions = {}): TNormalizedPatch {
  const now = resolveDemoNow(options.now ?? Date.now())
  return makeDemoDiff({
    ...options,
    now,
    until: options.until ?? toISODate(now),
  })
}

export function makeDemoDiff(options: TDemoDataOptions = {}): TNormalizedPatch {
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

  const NOW = resolveDemoNow(options.now)
  const DAY = 1000 * 60 * 60 * 24
  const until = options.until || defaultDemoUntil
  const scale = normalizeScale(options.scale)
  const demoCtx = {
    now: () => NOW,
    uuid: () => 'demo-id',
  }
  const merchantDomains: Record<string, string> = {}
  const demoTransactions = (
    idPrefix: string,
    opts: Omit<Parameters<typeof generateTransactions>[0], 'idPrefix' | 'until'>
  ) =>
    generateTransactions({
      ...opts,
      idPrefix,
      until,
      originalPayee:
        typeof opts.merchant === 'string'
          ? (merchantDomains[opts.merchant] ?? null)
          : null,
      pattern: {
        ...opts.pattern,
        every: scaleEvery(opts.pattern.every, scale),
      },
    })

  // Instruments
  const USD = 1
  const EUR = 3

  // Countries
  const DE = 3

  // User
  const mainUser: TUser = {
    id: 23880,
    changed: NOW,
    currency: EUR,
    parent: null,
    country: DE,
    countryCode: 'DE',
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
    const makeMerchant = (title: string, domain?: string) => {
      if (domain) merchantDomains[title] = domain
      return makeCoreMerchant({ id: title, title, user: user.id }, demoCtx)
    }

    const merchants = {
      // Grocery stores
      supermarket: makeMerchant('Lidl', 'lidl.com'),
      localStore: makeMerchant('Carrefour', 'carrefour.com'),

      // Restaurants & Food
      pizzaPlace: makeMerchant('Pizza Hut', 'pizzahut.com'),
      cafe: makeMerchant('Starbucks', 'starbucks.com'),
      fastFood: makeMerchant('McDonald’s', 'mcdonalds.com'),

      // Delivery services
      deliveryApp: makeMerchant('Wolt', 'wolt.com'),
      pizzaDelivery: makeMerchant('Domino’s', 'dominos.com'),

      // Transportation
      taxiService: makeMerchant('Uber', 'uber.com'),
      gasStation: makeMerchant('Shell', 'shell.com'),

      // Shopping
      electronics: makeMerchant('Apple', 'apple.com'),
      clothing: makeMerchant('Zara', 'zara.com'),

      // Bills & Services
      electricCompany: makeMerchant('E.ON', 'eon.com'),
      internetProvider: makeMerchant('Vodafone', 'vodafone.com'),

      // Healthcare
      pharmacy: makeMerchant('Boots', 'boots.com'),
      clinic: makeMerchant('Bupa', 'bupa.com'),

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
    balance?: number
    company?: number
  }) =>
    makeCoreAccount(
      {
        id: acc.title,
        user: mainUser.id,
        inBalance: true,
        ...acc,
      },
      demoCtx
    )

  const { Checking, Cash, Debt } = AccountType

  const accounts = {
    // ZenMoney requires a separate debt ledger; it is hidden from bank accounts.
    debt: makeAccount({
      title: 'Debts',
      instrument: mainUser.currency,
      type: Debt,
    }),
    travel: makeAccount({
      title: 'HSBC USD',
      instrument: USD,
      type: Checking,
      company: 15571,
      balance: 2400,
    }),
    daily: makeAccount({
      title: 'N26 EUR',
      instrument: EUR,
      type: Checking,
      company: 15542,
      balance: 800,
    }),
    euro: makeAccount({
      title: 'HSBC EUR',
      instrument: EUR,
      type: Checking,
      company: 15571,
      balance: 8200,
    }),
    dollar: makeAccount({
      title: 'Cash USD',
      instrument: USD,
      type: Cash,
      balance: 200,
    }),
    main: makeAccount({
      title: 'Revolut EUR',
      instrument: EUR,
      type: Checking,
      company: 15693,
      balance: 1500,
    }),
    shopping: makeAccount({
      title: 'Revolut Shopping',
      instrument: EUR,
      type: Checking,
      company: 15693,
      balance: 8000,
    }),
    bills: makeAccount({
      title: 'HSBC Bills',
      instrument: EUR,
      type: Checking,
      company: 15571,
      balance: 30000,
    }),
    cash: makeAccount({
      title: 'Cash EUR',
      instrument: EUR,
      type: Cash,
      balance: 300,
    }),
  }

  // Tags
  const makeTag = (tag: {
    title: string
    parent?: TTagId
    showIncome?: boolean
    showOutcome?: boolean
    icon?: TTagIconId
    color?: number | null
  }) =>
    makeCoreTag(
      {
        id: tag.title,
        user: mainUser.id,
        color: tag.color ?? hex2int(getColorForString(tag.title)),
        ...tag,
      },
      demoCtx
    )

  const tags = {
    // Income
    salary: makeTag({
      title: 'Salary',
      showIncome: true,
      icon: '9002_money_bag',
      color: hex2int('#4CAF50'),
    }),
    freelance: makeTag({
      title: 'Freelance',
      showIncome: true,
      icon: '5505_laptop',
      color: hex2int('#2196F3'),
    }),
    gifts: makeTag({
      title: 'Gifts',
      showIncome: true,
      icon: '7001_gift',
      color: hex2int('#E91E63'),
    }),

    // Outcome
    food: makeTag({
      title: 'Food',
      showOutcome: true,
      icon: '1002_diningroom',
      color: hex2int('#FF9800'),
    }),
    transportation: makeTag({
      title: 'Transportation',
      showOutcome: true,
      icon: '3002_cars',
      color: hex2int('#3F51B5'),
    }),
    entertainment: makeTag({
      title: 'Entertainment',
      showOutcome: true,
      icon: '2003_film_reel',
      color: hex2int('#9C27B0'),
    }),
    shopping: makeTag({
      title: 'Shopping',
      showOutcome: true,
      icon: '5006_shopping',
      color: hex2int('#F44336'),
    }),
    health: makeTag({
      title: 'Health',
      showOutcome: true,
      icon: '6502_pill',
      color: hex2int('#00BCD4'),
    }),
    bills: makeTag({
      title: 'Bills',
      showOutcome: true,
      icon: '9007_tax',
      color: hex2int('#795548'),
    }),
    other: makeTag({
      title: 'Other',
      showOutcome: true,
      icon: '8001_question',
      color: hex2int('#9E9E9E'),
    }),

    // Adjustment
    adjustment: makeTag({
      title: 'Adjustment',
      showIncome: true,
      showOutcome: true,
      icon: '9003_banknotes',
      color: hex2int('#607D8B'),
    }),
  }

  const tagsChildren = {
    publicTransport: makeTag({
      title: 'Public Transport',
      parent: tags.transportation.id,
      showOutcome: true,
      icon: '3010_bus',
      color: hex2int('#009688'),
    }),
    gas: makeTag({
      title: 'Gas',
      parent: tags.transportation.id,
      showOutcome: true,
      icon: '3501_gas_station',
      color: hex2int('#D4A017'),
    }),
    taxi: makeTag({
      title: 'Taxi',
      parent: tags.transportation.id,
      showOutcome: true,
      icon: '3004_taxi',
      color: hex2int('#D81B60'),
    }),

    groceries: makeTag({
      title: 'Groceries',
      parent: tags.food.id,
      showOutcome: true,
      icon: '1001_bunch_ingredients',
      color: hex2int('#7CB342'),
    }),
    restaurant: makeTag({
      title: 'Restaurant',
      parent: tags.food.id,
      showOutcome: true,
      icon: '1016_coffee_cup',
      color: hex2int('#FF7043'),
    }),
    delivery: makeTag({
      title: 'Delivery',
      parent: tags.food.id,
      showOutcome: true,
      icon: '2013_scooter',
      color: hex2int('#AB47BC'),
    }),

    rent: makeTag({
      title: 'Rent',
      parent: tags.bills.id,
      showOutcome: true,
      icon: '9011_mortgage',
      color: hex2int('#5C6BC0'),
    }),
    electricity: makeTag({
      title: 'Electricity',
      parent: tags.bills.id,
      showOutcome: true,
      icon: '5503_electrical',
      color: hex2int('#C0CA33'),
    }),
    internet: makeTag({
      title: 'Internet',
      parent: tags.bills.id,
      showOutcome: true,
      icon: '8002_globe',
      color: hex2int('#039BE5'),
    }),
  }

  // Budgets
  // skip for now

  // Reminders
  // skip for now

  // ReminderMarkers
  // skip for now

  // Transactions

  const transactions = [
    // Salary transactions
    ...demoTransactions('salary', {
      pattern: { since, repeat: 'monthly', every: 1, offset: 5 },
      user: mainUser.id,
      tag: [[tags.salary.id]],
      income: 2000,
      incomeAccount: accounts.main,
      comment: 'Regular salary',
    }),

    // Freelance transactions
    ...demoTransactions('freelance', {
      pattern: { since, repeat: 'monthly', every: 3, offset: 15 },
      user: mainUser.id,
      tag: [[tags.freelance.id]],
      income: 500,
      incomeAccount: accounts.daily,
    }),

    // Birthday Gifts
    ...demoTransactions('birthday-gifts', {
      pattern: { since, repeat: 'monthly', every: 12, offset: 0 },
      user: mainUser.id,
      tag: [[tags.gifts.id]],
      income: [100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650],
      incomeAccount: accounts.travel,
      merchant: merchants.wife.id,
      comment: 'Birthday gift',
    }),

    // Public Transport
    ...demoTransactions('public-transport', {
      pattern: { since, repeat: 'daily', every: 1, offset: 1 },
      user: mainUser.id,
      tag: [[tagsChildren.publicTransport.id]],
      outcome: [0.45, 0.5, 0.55],
      outcomeAccount: accounts.cash,
      comment: 'Metro/Bus fare',
    }),

    // Groceries transactions
    ...demoTransactions('groceries-supermarket', {
      pattern: { since, repeat: 'daily', every: 4, offset: 1 },
      user: mainUser.id,
      tag: [[tagsChildren.groceries.id]],
      outcome: [10, 51.6, 27.15, 113.45, 8.16, 31.9, 8, 50, 55],
      merchant: merchants.supermarket.id,
      outcomeAccount: accounts.main,
    }),
    ...demoTransactions('groceries-local-store', {
      pattern: { since, repeat: 'daily', every: 2, offset: 2 },
      user: mainUser.id,
      tag: [[tagsChildren.groceries.id]],
      outcome: [4.21, 1, 8.16, 8, 50, 5.5],
      merchant: merchants.localStore.id,
      outcomeAccount: accounts.daily,
    }),

    // Delivery transactions
    ...demoTransactions('delivery-app', {
      pattern: { since, repeat: 'daily', every: 8, offset: 1 },
      user: mainUser.id,
      tag: [[tagsChildren.delivery.id]],
      outcome: [16.3, 35.6, 25.81, 30, 17.29, 10],
      merchant: merchants.deliveryApp.id,
      outcomeAccount: accounts.main,
      comment: 'Food delivery',
    }),
    ...demoTransactions('pizza-delivery', {
      pattern: { since, repeat: 'daily', every: 12, offset: 3 },
      user: mainUser.id,
      tag: [[tagsChildren.delivery.id]],
      outcome: [12, 18, 24],
      merchant: merchants.pizzaDelivery.id,
      outcomeAccount: accounts.main,
      comment: 'Pizza delivery',
    }),

    // Restaurant transactions
    ...demoTransactions('restaurant-pizza', {
      pattern: { since, repeat: 'daily', every: 7, offset: 2 },
      user: mainUser.id,
      tag: [[tagsChildren.restaurant.id]],
      outcome: [25, 32, 41, 18, 55],
      merchant: merchants.pizzaPlace.id,
      outcomeAccount: accounts.main,
      comment: 'Dinner out',
    }),
    ...demoTransactions('restaurant-cafe', {
      pattern: { since, repeat: 'daily', every: 5, offset: 4 },
      user: mainUser.id,
      tag: [[tagsChildren.restaurant.id]],
      outcome: [4.5, 6.2, 3.8, 7.2],
      merchant: merchants.cafe.id,
      outcomeAccount: accounts.cash,
      comment: 'Coffee & snacks',
    }),
    ...demoTransactions('restaurant-fast-food', {
      pattern: { since, repeat: 'daily', every: 14, offset: 6 },
      user: mainUser.id,
      tag: [[tagsChildren.restaurant.id]],
      outcome: [8.5, 12, 9.5],
      merchant: merchants.fastFood.id,
      outcomeAccount: accounts.main,
      comment: 'Quick lunch',
    }),

    // Transportation
    ...demoTransactions('taxi', {
      pattern: { since, repeat: 'daily', every: 10, offset: 3 },
      user: mainUser.id,
      tag: [[tagsChildren.taxi.id]],
      outcome: [3, 4.5, 6, 7.5, 9],
      merchant: merchants.taxiService.id,
      outcomeAccount: accounts.daily,
      comment: 'Taxi ride',
    }),
    ...demoTransactions('gas', {
      pattern: { since, repeat: 'daily', every: 7, offset: 5 },
      user: mainUser.id,
      tag: [[tagsChildren.gas.id]],
      outcome: [20, 25, 30, 35],
      merchant: merchants.gasStation.id,
      outcomeAccount: accounts.main,
      comment: 'Gas refill',
    }),

    // Shopping
    ...demoTransactions('electronics', {
      pattern: { since, repeat: 'monthly', every: 2, offset: 20 },
      user: mainUser.id,
      tag: [[tags.shopping.id]],
      outcome: [150, 250, 80, 450, 120],
      merchant: merchants.electronics.id,
      outcomeAccount: accounts.shopping,
      comment: 'Electronics purchase',
    }),
    ...demoTransactions('clothing', {
      pattern: { since, repeat: 'monthly', every: 1, offset: 25 },
      user: mainUser.id,
      tag: [[tags.shopping.id]],
      outcome: [35, 52, 78, 21, 46],
      merchant: merchants.clothing.id,
      outcomeAccount: accounts.shopping,
      comment: 'Clothing',
    }),

    // Bills
    ...demoTransactions('electricity', {
      pattern: { since, repeat: 'monthly', every: 1, offset: 10 },
      user: mainUser.id,
      tag: [[tagsChildren.electricity.id]],
      outcome: [25, 32, 28, 35, 41],
      merchant: merchants.electricCompany.id,
      outcomeAccount: accounts.bills,
      comment: 'Electricity bill',
    }),
    ...demoTransactions('internet', {
      pattern: { since, repeat: 'monthly', every: 1, offset: 15 },
      user: mainUser.id,
      tag: [[tagsChildren.internet.id]],
      outcome: [12],
      merchant: merchants.internetProvider.id,
      outcomeAccount: accounts.bills,
      comment: 'Internet subscription',
    }),
    ...demoTransactions('rent', {
      pattern: { since, repeat: 'monthly', every: 1, offset: 3 },
      user: mainUser.id,
      tag: [[tagsChildren.rent.id]],
      outcome: [350],
      outcomeAccount: accounts.bills,
      comment: 'Monthly rent',
    }),

    // Healthcare
    ...demoTransactions('pharmacy', {
      pattern: { since, repeat: 'monthly', every: 3, offset: 18 },
      user: mainUser.id,
      tag: [[tags.health.id]],
      outcome: [8.5, 12, 6.5, 21],
      merchant: merchants.pharmacy.id,
      outcomeAccount: accounts.cash,
      comment: 'Medicine',
    }),
    ...demoTransactions('clinic', {
      pattern: { since, repeat: 'monthly', every: 6, offset: 25 },
      user: mainUser.id,
      tag: [[tags.health.id]],
      outcome: [35, 50, 75],
      merchant: merchants.clinic.id,
      outcomeAccount: accounts.main,
      comment: 'Medical checkup',
    }),

    // Entertainment
    ...demoTransactions('entertainment', {
      pattern: { since, repeat: 'daily', every: 15, offset: 8 },
      user: mainUser.id,
      tag: [[tags.entertainment.id]],
      outcome: [15, 22, 30, 18],
      outcomeAccount: accounts.main,
      comment: 'Movies/Entertainment',
    }),

    // Personal transfers (friends/family)
    ...demoTransactions('friend-loan', {
      pattern: { since, repeat: 'monthly', every: 3, offset: 12 },
      user: mainUser.id,
      tag: [[tags.other.id]],
      outcome: [50, 80, 30],
      merchant: merchants.friend.id,
      outcomeAccount: accounts.daily,
      comment: 'Loan to friend',
    }),
    ...demoTransactions('mother-gift', {
      pattern: { since, repeat: 'monthly', every: 4, offset: 8 },
      user: mainUser.id,
      tag: [[tags.gifts.id]],
      outcome: [25, 40, 60],
      merchant: merchants.mother.id,
      outcomeAccount: accounts.daily,
      comment: 'Gift for mother',
    }),
    // Regular cash withdrawals
    ...demoTransactions('cash-withdrawal', {
      pattern: { since, repeat: 'monthly', every: 1, offset: 2 },
      user: mainUser.id,
      outcome: 100,
      income: 100,
      outcomeAccount: accounts.daily,
      incomeAccount: accounts.cash,
      comment: 'ATM withdrawal',
    }),
    // Transfer to daily account
    ...demoTransactions('daily-account-transfer', {
      pattern: { since, repeat: 'monthly', every: 1, offset: 10 },
      user: mainUser.id,
      outcome: [500, 40, 60, 200],
      income: [500, 40, 60, 200],
      outcomeAccount: accounts.main,
      incomeAccount: accounts.daily,
      comment: 'Transfer to N26',
    }),
  ]

  const diff: TNormalizedPatch = {
    serverTimestamp: NOW,
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
  return diff
}

export function makeDemoStore(options: TDemoDataOptions = {}): TDataStore {
  const diff = makeDemoDiff(options)

  return {
    serverTimestamp: diff.serverTimestamp || 0,
    instrument: byId(diff.instrument),
    country: byId(diff.country),
    company: byId(diff.company),
    user: byId(diff.user),
    merchant: byId(diff.merchant),
    account: byId(diff.account),
    tag: byId(diff.tag),
    budget: byId(diff.budget),
    reminder: byId(diff.reminder),
    reminderMarker: byId(diff.reminderMarker),
    transaction: byId(diff.transaction),
  }
}

function resolveDemoNow(now: TDemoDataOptions['now']): number {
  if (typeof now === 'number') return now
  if (now instanceof Date) return +now
  if (typeof now === 'string') return Date.parse(now)
  return defaultDemoNow
}

function normalizeScale(scale: TDemoDataOptions['scale']): number {
  if (!scale || !Number.isFinite(scale)) return 1
  return Math.max(0.05, scale)
}

function scaleEvery(every: number, scale: number): number {
  return Math.max(1, Math.round(every / scale))
}

function byId<T extends { id: string | number }>(items: T[] = []): ById<T> {
  return Object.fromEntries(items.map(item => [item.id, item])) as ById<T>
}
