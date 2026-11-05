import countries from './countries.json'
import companies from './companies.json'
import instruments from './instruments.json'
import { englishProfile, type TDemoProfile } from './locales/en'
import { russianProfile } from './locales/ru'
import type { ById } from '../../internal/domain/foundation/types'
import { toISODate } from '../../internal/domain/foundation/date'
import { round } from '../../internal/domain/foundation/numbers'
import { generateTransactions } from './generateTransactions'
import type { TTagIconId } from '../../runtime/presentation/tag-icons'
import {
  makeAccount as makeCoreAccount,
  type TAccountId,
} from '../../internal/domain/zenmoney/entities/accounts'
import { makeMerchant as makeCoreMerchant } from '../../internal/domain/zenmoney/entities/merchants'
import {
  makeTag as makeCoreTag,
  type TTagId,
} from '../../internal/domain/zenmoney/entities/tags'
import type { TUser } from '../../internal/domain/zenmoney/entities/users'
import type { TISODate } from '../../internal/domain/foundation/primitives'
import type {
  TDataStore,
  TNormalizedPatch,
} from '../../internal/domain/zenmoney/model/store'
import { hex2int } from '../../internal/domain/zenmoney/model/color'

const since: TISODate = '2022-06-19'
const defaultDemoNow = Date.parse('2026-07-06T12:00:00.000Z')
const defaultDemoUntil: TISODate = '2026-07-06'

export type TDemoDataOptions = {
  now?: number | Date | string
  until?: TISODate
  scale?: number
  locale?: 'en' | 'ru'
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

  const profile: TDemoProfile =
    options.locale === 'ru' ? russianProfile : englishProfile
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
    idPrefix: keyof TDemoProfile['transactions'],
    opts: Omit<Parameters<typeof generateTransactions>[0], 'idPrefix' | 'until'>
  ) =>
    generateTransactions({
      ...opts,
      ...profile.transactions[idPrefix],
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

  // User
  const mainUser: TUser = {
    id: 23880,
    changed: NOW,
    currency: profile.currency,
    parent: null,
    country: profile.country,
    countryCode: profile.countryCode,
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
    const makeMerchant = (key: keyof TDemoProfile['merchants']) => {
      const { title, domain } = profile.merchants[key]
      if (domain) merchantDomains[title] = domain
      return makeCoreMerchant({ id: title, title, user: user.id }, demoCtx)
    }

    const merchants = {
      // Grocery stores
      supermarket: makeMerchant('supermarket'),
      localStore: makeMerchant('localStore'),

      // Restaurants & Food
      pizzaPlace: makeMerchant('pizzaPlace'),
      cafe: makeMerchant('cafe'),
      fastFood: makeMerchant('fastFood'),

      // Delivery services
      deliveryApp: makeMerchant('deliveryApp'),
      pizzaDelivery: makeMerchant('pizzaDelivery'),

      // Transportation
      taxiService: makeMerchant('taxiService'),
      gasStation: makeMerchant('gasStation'),

      // Shopping
      electronics: makeMerchant('electronics'),
      clothing: makeMerchant('clothing'),

      // Bills & Services
      electricCompany: makeMerchant('electricCompany'),
      internetProvider: makeMerchant('internetProvider'),

      // Healthcare
      pharmacy: makeMerchant('pharmacy'),
      clinic: makeMerchant('clinic'),

      // People
      friend: makeMerchant('friend'),
      mother: makeMerchant('mother'),
      wife: makeMerchant('wife'),
    }
    return merchants
  }

  const merchants = makeMerchants(mainUser)

  // Accounts
  const makeAccount = (key: keyof TDemoProfile['accounts']) => {
    const acc = profile.accounts[key]
    return makeCoreAccount(
      { id: acc.title, user: mainUser.id, inBalance: true, ...acc },
      demoCtx
    )
  }

  const accounts = {
    // Zenmoney requires a separate debt ledger; it is hidden from bank accounts.
    debt: makeAccount('debt'),
    travel: makeAccount('travel'),
    daily: makeAccount('daily'),
    savings: makeAccount('savings'),
    cashReserve: makeAccount('cashReserve'),
    main: makeAccount('main'),
    shopping: makeAccount('shopping'),
    bills: makeAccount('bills'),
    cash: makeAccount('cash'),
  }

  // Tags
  const makeTag = (tag: {
    key: keyof TDemoProfile['tags']
    parent?: TTagId
    showIncome?: boolean
    showOutcome?: boolean
    icon?: TTagIconId
    color: string
  }) => {
    const { key, ...appearance } = tag
    return makeCoreTag(
      {
        id: profile.tags[key],
        title: profile.tags[key],
        user: mainUser.id,
        ...appearance,
        color: hex2int(tag.color),
      },
      demoCtx
    )
  }

  const tags = {
    // Income
    salary: makeTag({
      key: 'salary',
      showIncome: true,
      icon: '9002_money_bag',
      color: '#44A649',
    }),
    freelance: makeTag({
      key: 'freelance',
      showIncome: true,
      icon: '5505_laptop',
      color: '#28B6F6',
    }),
    gifts: makeTag({
      key: 'gifts',
      showIncome: true,
      icon: '7001_gift',
      color: '#CC3077',
    }),

    // Outcome
    food: makeTag({
      key: 'food',
      showOutcome: true,
      icon: '1002_diningroom',
      color: '#FB8D00',
    }),
    transportation: makeTag({
      key: 'transportation',
      showOutcome: true,
      icon: '3002_cars',
      color: '#1764BC',
    }),
    entertainment: makeTag({
      key: 'entertainment',
      showOutcome: true,
      icon: '2003_film_reel',
      color: '#9C26B0',
    }),
    shopping: makeTag({
      key: 'shopping',
      showOutcome: true,
      icon: '5006_shopping',
      color: '#F35239',
    }),
    health: makeTag({
      key: 'health',
      showOutcome: true,
      icon: '6502_pill',
      color: '#179EC8',
    }),
    bills: makeTag({
      key: 'bills',
      showOutcome: true,
      icon: '9007_tax',
      color: '#414141',
    }),
    other: makeTag({
      key: 'other',
      showOutcome: true,
      icon: '8001_question',
      color: '#91929A',
    }),

    // Adjustment
    adjustment: makeTag({
      key: 'adjustment',
      showIncome: true,
      showOutcome: true,
      icon: '9003_banknotes',
      color: '#358075',
    }),
  }

  const tagsChildren = {
    publicTransport: makeTag({
      key: 'publicTransport',
      parent: tags.transportation.id,
      showOutcome: true,
      icon: '3010_bus',
      color: '#358075',
    }),
    gas: makeTag({
      key: 'gas',
      parent: tags.transportation.id,
      showOutcome: true,
      icon: '3501_gas_station',
      color: '#FBBB00',
    }),
    taxi: makeTag({
      key: 'taxi',
      parent: tags.transportation.id,
      showOutcome: true,
      icon: '3004_taxi',
      color: '#CC3077',
    }),

    groceries: makeTag({
      key: 'groceries',
      parent: tags.food.id,
      showOutcome: true,
      icon: '1001_bunch_ingredients',
      color: '#72D176',
    }),
    restaurant: makeTag({
      key: 'restaurant',
      parent: tags.food.id,
      showOutcome: true,
      icon: '1016_coffee_cup',
      color: '#F35239',
    }),
    delivery: makeTag({
      key: 'delivery',
      parent: tags.food.id,
      showOutcome: true,
      icon: '2013_scooter',
      color: '#9C26B0',
    }),

    rent: makeTag({
      key: 'rent',
      parent: tags.bills.id,
      showOutcome: true,
      icon: '9011_mortgage',
      color: '#8066DB',
    }),
    electricity: makeTag({
      key: 'electricity',
      parent: tags.bills.id,
      showOutcome: true,
      icon: '5503_electrical',
      color: '#FBBB00',
    }),
    internet: makeTag({
      key: 'internet',
      parent: tags.bills.id,
      showOutcome: true,
      icon: '8002_globe',
      color: '#179EC8',
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
      incomeAccount: accounts.main,
    }),

    // Freelance transactions
    ...demoTransactions('freelance', {
      pattern: { since, repeat: 'monthly', every: 3, offset: 15 },
      user: mainUser.id,
      tag: [[tags.freelance.id]],
      incomeAccount: accounts.daily,
    }),

    // Birthday Gifts
    ...demoTransactions('birthday-gifts', {
      pattern: { since, repeat: 'monthly', every: 12, offset: 0 },
      user: mainUser.id,
      tag: [[tags.gifts.id]],
      incomeAccount: accounts.travel,
      merchant: merchants.wife.id,
    }),

    // Public Transport
    ...demoTransactions('public-transport', {
      pattern: { since, repeat: 'daily', every: 1, offset: 1 },
      user: mainUser.id,
      tag: [[tagsChildren.publicTransport.id]],
      outcomeAccount: accounts.cash,
    }),

    // Groceries transactions
    ...demoTransactions('groceries-supermarket', {
      pattern: { since, repeat: 'daily', every: 4, offset: 1 },
      user: mainUser.id,
      tag: [[tagsChildren.groceries.id]],
      merchant: merchants.supermarket.id,
      outcomeAccount: accounts.main,
    }),
    ...demoTransactions('groceries-local-store', {
      pattern: { since, repeat: 'daily', every: 2, offset: 2 },
      user: mainUser.id,
      tag: [[tagsChildren.groceries.id]],
      merchant: merchants.localStore.id,
      outcomeAccount: accounts.daily,
    }),

    // Delivery transactions
    ...demoTransactions('delivery-app', {
      pattern: { since, repeat: 'daily', every: 8, offset: 1 },
      user: mainUser.id,
      tag: [[tagsChildren.delivery.id]],
      merchant: merchants.deliveryApp.id,
      outcomeAccount: accounts.main,
    }),
    ...demoTransactions('pizza-delivery', {
      pattern: { since, repeat: 'daily', every: 12, offset: 3 },
      user: mainUser.id,
      tag: [[tagsChildren.delivery.id]],
      merchant: merchants.pizzaDelivery.id,
      outcomeAccount: accounts.main,
    }),

    // Restaurant transactions
    ...demoTransactions('restaurant-pizza', {
      pattern: { since, repeat: 'daily', every: 7, offset: 2 },
      user: mainUser.id,
      tag: [[tagsChildren.restaurant.id]],
      merchant: merchants.pizzaPlace.id,
      outcomeAccount: accounts.main,
    }),
    ...demoTransactions('restaurant-cafe', {
      pattern: { since, repeat: 'daily', every: 5, offset: 4 },
      user: mainUser.id,
      tag: [[tagsChildren.restaurant.id]],
      merchant: merchants.cafe.id,
      outcomeAccount: accounts.cash,
    }),
    ...demoTransactions('restaurant-fast-food', {
      pattern: { since, repeat: 'daily', every: 14, offset: 6 },
      user: mainUser.id,
      tag: [[tagsChildren.restaurant.id]],
      merchant: merchants.fastFood.id,
      outcomeAccount: accounts.main,
    }),

    // Transportation
    ...demoTransactions('taxi', {
      pattern: { since, repeat: 'daily', every: 10, offset: 3 },
      user: mainUser.id,
      tag: [[tagsChildren.taxi.id]],
      merchant: merchants.taxiService.id,
      outcomeAccount: accounts.daily,
    }),
    ...demoTransactions('gas', {
      pattern: { since, repeat: 'daily', every: 7, offset: 5 },
      user: mainUser.id,
      tag: [[tagsChildren.gas.id]],
      merchant: merchants.gasStation.id,
      outcomeAccount: accounts.main,
    }),

    // Shopping
    ...demoTransactions('electronics', {
      pattern: { since, repeat: 'monthly', every: 2, offset: 20 },
      user: mainUser.id,
      tag: [[tags.shopping.id]],
      merchant: merchants.electronics.id,
      outcomeAccount: accounts.shopping,
    }),
    ...demoTransactions('clothing', {
      pattern: { since, repeat: 'monthly', every: 1, offset: 25 },
      user: mainUser.id,
      tag: [[tags.shopping.id]],
      merchant: merchants.clothing.id,
      outcomeAccount: accounts.shopping,
    }),

    // Bills
    ...demoTransactions('electricity', {
      pattern: { since, repeat: 'monthly', every: 1, offset: 10 },
      user: mainUser.id,
      tag: [[tagsChildren.electricity.id]],
      merchant: merchants.electricCompany.id,
      outcomeAccount: accounts.bills,
    }),
    ...demoTransactions('internet', {
      pattern: { since, repeat: 'monthly', every: 1, offset: 15 },
      user: mainUser.id,
      tag: [[tagsChildren.internet.id]],
      merchant: merchants.internetProvider.id,
      outcomeAccount: accounts.bills,
    }),
    ...demoTransactions('rent', {
      pattern: { since, repeat: 'monthly', every: 1, offset: 3 },
      user: mainUser.id,
      tag: [[tagsChildren.rent.id]],
      outcomeAccount: accounts.bills,
    }),

    // Healthcare
    ...demoTransactions('pharmacy', {
      pattern: { since, repeat: 'monthly', every: 3, offset: 18 },
      user: mainUser.id,
      tag: [[tags.health.id]],
      merchant: merchants.pharmacy.id,
      outcomeAccount: accounts.cash,
    }),
    ...demoTransactions('clinic', {
      pattern: { since, repeat: 'monthly', every: 6, offset: 25 },
      user: mainUser.id,
      tag: [[tags.health.id]],
      merchant: merchants.clinic.id,
      outcomeAccount: accounts.main,
    }),

    // Entertainment
    ...demoTransactions('entertainment', {
      pattern: { since, repeat: 'daily', every: 15, offset: 8 },
      user: mainUser.id,
      tag: [[tags.entertainment.id]],
      outcomeAccount: accounts.main,
    }),

    // Personal transfers (friends/family)
    ...demoTransactions('friend-loan', {
      pattern: { since, repeat: 'monthly', every: 3, offset: 12 },
      user: mainUser.id,
      tag: [[tags.other.id]],
      merchant: merchants.friend.id,
      outcomeAccount: accounts.daily,
    }),
    ...demoTransactions('mother-gift', {
      pattern: { since, repeat: 'monthly', every: 4, offset: 8 },
      user: mainUser.id,
      tag: [[tags.gifts.id]],
      merchant: merchants.mother.id,
      outcomeAccount: accounts.daily,
    }),
    // Regular cash withdrawals
    ...demoTransactions('cash-withdrawal', {
      pattern: { since, repeat: 'monthly', every: 1, offset: 2 },
      user: mainUser.id,
      outcomeAccount: accounts.daily,
      incomeAccount: accounts.cash,
    }),
    // Transfer to daily account
    ...demoTransactions('daily-account-transfer', {
      pattern: { since, repeat: 'monthly', every: 1, offset: 10 },
      user: mainUser.id,
      outcomeAccount: accounts.main,
      incomeAccount: accounts.daily,
    }),
  ]

  for (const transfer of profile.transfers ?? []) {
    transactions.push(
      ...generateTransactions({
        idPrefix: transfer.id,
        until,
        pattern: {
          since,
          repeat: 'monthly',
          every: scaleEvery(1, scale),
          offset: 6,
        },
        user: mainUser.id,
        outcome: transfer.amount,
        income: transfer.amount,
        outcomeAccount: accounts[transfer.from],
        incomeAccount: accounts[transfer.to],
        comment: transfer.comment,
      })
    )
  }

  const diff: TNormalizedPatch = {
    serverTimestamp: NOW,
    instrument: instruments,
    country: countries,
    company: companies.map(company => ({
      ...company,
      ...profile.companies?.[company.id],
    })),
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
