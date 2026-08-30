import countries from './countries.json'
import companies from './companies.json'
import instruments from './instruments.json'
import type { ById } from '../../internal/domain/foundation/types'
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
  return makeDemoDiff(options)
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
  const demoTransactions = (
    idPrefix: string,
    opts: Omit<Parameters<typeof generateTransactions>[0], 'idPrefix' | 'until'>
  ) =>
    generateTransactions({
      ...opts,
      idPrefix,
      until,
      pattern: {
        ...opts.pattern,
        every: scaleEvery(opts.pattern.every, scale),
      },
    })

  // Instruments
  const USD = 1
  const RUB = 2
  const EUR = 3

  // Countries
  const RU = 1

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
      makeCoreMerchant({ id: title, title, user: user.id }, demoCtx)

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
    makeCoreAccount(
      {
        id: acc.title,
        user: mainUser.id,
        inBalance: true,
        ...acc,
      },
      demoCtx
    )

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
      color: hex2int('#5C6BC0'),
    }),
    gas: makeTag({
      title: 'Gas',
      parent: tags.transportation.id,
      showOutcome: true,
      icon: '3501_gas_station',
      color: hex2int('#3949AB'),
    }),
    taxi: makeTag({
      title: 'Taxi',
      parent: tags.transportation.id,
      showOutcome: true,
      icon: '3004_taxi',
      color: hex2int('#7986CB'),
    }),

    groceries: makeTag({
      title: 'Groceries',
      parent: tags.food.id,
      showOutcome: true,
      icon: '1001_bunch_ingredients',
      color: hex2int('#FFA726'),
    }),
    restaurant: makeTag({
      title: 'Restaurant',
      parent: tags.food.id,
      showOutcome: true,
      icon: '1016_coffee_cup',
      color: hex2int('#FB8C00'),
    }),
    delivery: makeTag({
      title: 'Delivery',
      parent: tags.food.id,
      showOutcome: true,
      icon: '2013_scooter',
      color: hex2int('#FFB74D'),
    }),

    rent: makeTag({
      title: 'Rent',
      parent: tags.bills.id,
      showOutcome: true,
      icon: '9011_mortgage',
      color: hex2int('#8D6E63'),
    }),
    electricity: makeTag({
      title: 'Electricity',
      parent: tags.bills.id,
      showOutcome: true,
      icon: '5503_electrical',
      color: hex2int('#6D4C41'),
    }),
    internet: makeTag({
      title: 'Internet',
      parent: tags.bills.id,
      showOutcome: true,
      icon: '8002_globe',
      color: hex2int('#A1887F'),
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
      income: 200_000,
      incomeAccount: accounts.ccardRUB,
      comment: 'Regular salary',
    }),

    // Freelance transactions
    ...demoTransactions('freelance', {
      pattern: { since, repeat: 'monthly', every: 3, offset: 15 },
      user: mainUser.id,
      tag: [[tags.freelance.id]],
      income: 50_000,
      incomeAccount: accounts.cashRUB,
    }),

    // Birthday Gifts
    ...demoTransactions('birthday-gifts', {
      pattern: { since, repeat: 'monthly', every: 12, offset: 0 },
      user: mainUser.id,
      tag: [[tags.gifts.id]],
      income: [100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650],
      incomeAccount: accounts.cashUSD,
      merchant: merchants.wife.id,
      comment: 'Birthday gift',
    }),

    // Public Transport
    ...demoTransactions('public-transport', {
      pattern: { since, repeat: 'daily', every: 1, offset: 1 },
      user: mainUser.id,
      tag: [[tagsChildren.publicTransport.id]],
      outcome: [45, 50, 55],
      outcomeAccount: accounts.cashRUB,
      comment: 'Metro/Bus fare',
    }),

    // Groceries transactions
    ...demoTransactions('groceries-supermarket', {
      pattern: { since, repeat: 'daily', every: 4, offset: 1 },
      user: mainUser.id,
      tag: [[tagsChildren.groceries.id]],
      outcome: [1000, 5160, 2715, 11345, 816, 3190, 800, 5000, 5500],
      merchant: merchants.supermarket.id,
      outcomeAccount: accounts.ccardRUB,
    }),
    ...demoTransactions('groceries-local-store', {
      pattern: { since, repeat: 'daily', every: 2, offset: 2 },
      user: mainUser.id,
      tag: [[tagsChildren.groceries.id]],
      outcome: [420.5, 100.32, 816, 800, 5000, 550],
      merchant: merchants.localStore.id,
      outcomeAccount: accounts.cashRUB,
    }),

    // Delivery transactions
    ...demoTransactions('delivery-app', {
      pattern: { since, repeat: 'daily', every: 8, offset: 1 },
      user: mainUser.id,
      tag: [[tagsChildren.delivery.id]],
      outcome: [1630, 3560, 2581, 3000, 1729, 1000],
      merchant: merchants.deliveryApp.id,
      outcomeAccount: accounts.ccardRUB,
      comment: 'Food delivery',
    }),
    ...demoTransactions('pizza-delivery', {
      pattern: { since, repeat: 'daily', every: 12, offset: 3 },
      user: mainUser.id,
      tag: [[tagsChildren.delivery.id]],
      outcome: [1200, 1800, 2400],
      merchant: merchants.pizzaDelivery.id,
      outcomeAccount: accounts.ccardRUB,
      comment: 'Pizza delivery',
    }),

    // Restaurant transactions
    ...demoTransactions('restaurant-pizza', {
      pattern: { since, repeat: 'daily', every: 7, offset: 2 },
      user: mainUser.id,
      tag: [[tagsChildren.restaurant.id]],
      outcome: [2500, 3200, 4100, 1800, 5500],
      merchant: merchants.pizzaPlace.id,
      outcomeAccount: accounts.ccardRUB,
      comment: 'Dinner out',
    }),
    ...demoTransactions('restaurant-cafe', {
      pattern: { since, repeat: 'daily', every: 5, offset: 4 },
      user: mainUser.id,
      tag: [[tagsChildren.restaurant.id]],
      outcome: [450, 620, 380, 720],
      merchant: merchants.cafe.id,
      outcomeAccount: accounts.cashRUB,
      comment: 'Coffee & snacks',
    }),
    ...demoTransactions('restaurant-fast-food', {
      pattern: { since, repeat: 'daily', every: 14, offset: 6 },
      user: mainUser.id,
      tag: [[tagsChildren.restaurant.id]],
      outcome: [850, 1200, 950],
      merchant: merchants.fastFood.id,
      outcomeAccount: accounts.ccardRUB,
      comment: 'Quick lunch',
    }),

    // Transportation
    ...demoTransactions('taxi', {
      pattern: { since, repeat: 'daily', every: 10, offset: 3 },
      user: mainUser.id,
      tag: [[tagsChildren.taxi.id]],
      outcome: [300, 450, 600, 750, 900],
      merchant: merchants.taxiService.id,
      outcomeAccount: accounts.cashRUB,
      comment: 'Taxi ride',
    }),
    ...demoTransactions('gas', {
      pattern: { since, repeat: 'daily', every: 7, offset: 5 },
      user: mainUser.id,
      tag: [[tagsChildren.gas.id]],
      outcome: [2000, 2500, 3000, 3500],
      merchant: merchants.gasStation.id,
      outcomeAccount: accounts.ccardRUB,
      comment: 'Gas refill',
    }),

    // Shopping
    ...demoTransactions('electronics', {
      pattern: { since, repeat: 'monthly', every: 2, offset: 20 },
      user: mainUser.id,
      tag: [[tags.shopping.id]],
      outcome: [15000, 25000, 8000, 45000, 12000],
      merchant: merchants.electronics.id,
      outcomeAccount: accounts.ccardRUB,
      comment: 'Electronics purchase',
    }),
    ...demoTransactions('clothing', {
      pattern: { since, repeat: 'monthly', every: 1, offset: 25 },
      user: mainUser.id,
      tag: [[tags.shopping.id]],
      outcome: [3500, 5200, 7800, 2100, 4600],
      merchant: merchants.clothing.id,
      outcomeAccount: accounts.ccardRUB,
      comment: 'Clothing',
    }),

    // Bills
    ...demoTransactions('electricity', {
      pattern: { since, repeat: 'monthly', every: 1, offset: 10 },
      user: mainUser.id,
      tag: [[tagsChildren.electricity.id]],
      outcome: [2500, 3200, 2800, 3500, 4100],
      merchant: merchants.electricCompany.id,
      outcomeAccount: accounts.ccardRUB,
      comment: 'Electricity bill',
    }),
    ...demoTransactions('internet', {
      pattern: { since, repeat: 'monthly', every: 1, offset: 15 },
      user: mainUser.id,
      tag: [[tagsChildren.internet.id]],
      outcome: [1200],
      merchant: merchants.internetProvider.id,
      outcomeAccount: accounts.ccardRUB,
      comment: 'Internet subscription',
    }),
    ...demoTransactions('rent', {
      pattern: { since, repeat: 'monthly', every: 1, offset: 3 },
      user: mainUser.id,
      tag: [[tagsChildren.rent.id]],
      outcome: [35000],
      outcomeAccount: accounts.ccardRUB,
      comment: 'Monthly rent',
    }),

    // Healthcare
    ...demoTransactions('pharmacy', {
      pattern: { since, repeat: 'monthly', every: 3, offset: 18 },
      user: mainUser.id,
      tag: [[tags.health.id]],
      outcome: [850, 1200, 650, 2100],
      merchant: merchants.pharmacy.id,
      outcomeAccount: accounts.cashRUB,
      comment: 'Medicine',
    }),
    ...demoTransactions('clinic', {
      pattern: { since, repeat: 'monthly', every: 6, offset: 25 },
      user: mainUser.id,
      tag: [[tags.health.id]],
      outcome: [3500, 5000, 7500],
      merchant: merchants.clinic.id,
      outcomeAccount: accounts.ccardRUB,
      comment: 'Medical checkup',
    }),

    // Entertainment
    ...demoTransactions('entertainment', {
      pattern: { since, repeat: 'daily', every: 15, offset: 8 },
      user: mainUser.id,
      tag: [[tags.entertainment.id]],
      outcome: [1500, 2200, 3000, 1800],
      outcomeAccount: accounts.ccardRUB,
      comment: 'Movies/Entertainment',
    }),

    // Personal transfers (friends/family)
    ...demoTransactions('friend-loan', {
      pattern: { since, repeat: 'monthly', every: 3, offset: 12 },
      user: mainUser.id,
      tag: [[tags.other.id]],
      outcome: [5000, 8000, 3000],
      merchant: merchants.friend.id,
      outcomeAccount: accounts.cashRUB,
      comment: 'Loan to friend',
    }),
    ...demoTransactions('mother-gift', {
      pattern: { since, repeat: 'monthly', every: 4, offset: 8 },
      user: mainUser.id,
      tag: [[tags.gifts.id]],
      outcome: [2500, 4000, 6000],
      merchant: merchants.mother.id,
      outcomeAccount: accounts.cashRUB,
      comment: 'Gift for mother',
    }),
    // Transfer to Cash RUB
    ...demoTransactions('cash-rub-transfer', {
      pattern: { since, repeat: 'monthly', every: 1, offset: 10 },
      user: mainUser.id,
      outcome: [50000, 4000, 6000, 20000],
      income: [50000, 4000, 6000, 20000],
      outcomeAccount: accounts.ccardRUB,
      incomeAccount: accounts.cashRUB,
      comment: 'Transfer to Cash RUB',
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
