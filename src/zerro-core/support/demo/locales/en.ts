import { AccountType } from '../../../internal/domain/zenmoney/entities/accounts'

export const englishProfile = {
  currency: 3,
  country: 3,
  countryCode: 'DE',
  merchants: {
    supermarket: { title: 'Lidl', domain: 'lidl.com' },
    localStore: { title: 'Carrefour', domain: 'carrefour.com' },
    pizzaPlace: { title: 'Pizza Hut', domain: 'pizzahut.com' },
    cafe: { title: 'Starbucks', domain: 'starbucks.com' },
    fastFood: { title: 'McDonald’s', domain: 'mcdonalds.com' },
    deliveryApp: { title: 'Wolt', domain: 'wolt.com' },
    pizzaDelivery: { title: 'Domino’s', domain: 'dominos.com' },
    taxiService: { title: 'Uber', domain: 'uber.com' },
    gasStation: { title: 'Shell', domain: 'shell.com' },
    electronics: { title: 'Apple', domain: 'apple.com' },
    clothing: { title: 'Zara', domain: 'zara.com' },
    electricCompany: { title: 'E.ON', domain: 'eon.com' },
    internetProvider: { title: 'Vodafone', domain: 'vodafone.com' },
    pharmacy: { title: 'Boots', domain: 'boots.com' },
    clinic: { title: 'Bupa', domain: 'bupa.com' },
    friend: { title: 'Alex' },
    mother: { title: 'Mother' },
    wife: { title: 'Wife' },
  },
  accounts: {
    debt: {
      title: 'Debts',
      instrument: 3,
      type: AccountType.Debt,
    },
    travel: {
      title: 'HSBC USD',
      instrument: 1,
      type: AccountType.Checking,
      company: 15571,
      balance: 2400,
    },
    daily: {
      title: 'N26 EUR',
      instrument: 3,
      type: AccountType.Checking,
      company: 15542,
      balance: 800,
    },
    savings: {
      title: 'HSBC EUR',
      instrument: 3,
      type: AccountType.Checking,
      company: 15571,
      balance: 8200,
    },
    cashReserve: {
      title: 'Cash USD',
      instrument: 1,
      type: AccountType.Cash,
      balance: 200,
    },
    main: {
      title: 'Revolut EUR',
      instrument: 3,
      type: AccountType.Checking,
      company: 15693,
      balance: 1500,
    },
    shopping: {
      title: 'Revolut Shopping',
      instrument: 3,
      type: AccountType.Checking,
      company: 15693,
      balance: 8000,
    },
    bills: {
      title: 'HSBC Bills',
      instrument: 3,
      type: AccountType.Checking,
      company: 15571,
      balance: 30000,
    },
    cash: {
      title: 'Cash EUR',
      instrument: 3,
      type: AccountType.Cash,
      balance: 300,
    },
  },
  tags: {
    salary: 'Salary',
    freelance: 'Freelance',
    gifts: 'Gifts',
    food: 'Food',
    transportation: 'Transportation',
    entertainment: 'Entertainment',
    shopping: 'Shopping',
    health: 'Health',
    bills: 'Bills',
    other: 'Other',
    adjustment: 'Adjustment',
    publicTransport: 'Public Transport',
    gas: 'Gas',
    taxi: 'Taxi',
    groceries: 'Groceries',
    restaurant: 'Restaurant',
    delivery: 'Delivery',
    rent: 'Rent',
    electricity: 'Electricity',
    internet: 'Internet',
  },
  transactions: {
    salary: {
      income: 2000,
      comment: 'Regular salary',
    },
    freelance: {
      income: 500,
    },
    'birthday-gifts': {
      income: [100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650],
      comment: 'Birthday gift',
    },
    'public-transport': {
      outcome: [0.45, 0.5, 0.55],
      comment: 'Metro/Bus fare',
    },
    'groceries-supermarket': {
      outcome: [10, 51.6, 27.15, 113.45, 8.16, 31.9, 8, 50, 55],
    },
    'groceries-local-store': {
      outcome: [4.21, 1, 8.16, 8, 50, 5.5],
    },
    'delivery-app': {
      outcome: [16.3, 35.6, 25.81, 30, 17.29, 10],
      comment: 'Food delivery',
    },
    'pizza-delivery': {
      outcome: [12, 18, 24],
      comment: 'Pizza delivery',
    },
    'restaurant-pizza': {
      outcome: [25, 32, 41, 18, 55],
      comment: 'Dinner out',
    },
    'restaurant-cafe': {
      outcome: [4.5, 6.2, 3.8, 7.2],
      comment: 'Coffee & snacks',
    },
    'restaurant-fast-food': {
      outcome: [8.5, 12, 9.5],
      comment: 'Quick lunch',
    },
    taxi: {
      outcome: [3, 4.5, 6, 7.5, 9],
      comment: 'Taxi ride',
    },
    gas: {
      outcome: [20, 25, 30, 35],
      comment: 'Gas refill',
    },
    electronics: {
      outcome: [150, 250, 80, 450, 120],
      comment: 'Electronics purchase',
    },
    clothing: {
      outcome: [35, 52, 78, 21, 46],
      comment: 'Clothing',
    },
    electricity: {
      outcome: [25, 32, 28, 35, 41],
      comment: 'Electricity bill',
    },
    internet: {
      outcome: [12],
      comment: 'Internet subscription',
    },
    rent: {
      outcome: [350],
      comment: 'Monthly rent',
    },
    pharmacy: {
      outcome: [8.5, 12, 6.5, 21],
      comment: 'Medicine',
    },
    clinic: {
      outcome: [35, 50, 75],
      comment: 'Medical checkup',
    },
    entertainment: {
      outcome: [15, 22, 30, 18],
      comment: 'Movies/Entertainment',
    },
    'friend-loan': {
      outcome: [50, 80, 30],
      comment: 'Loan to friend',
    },
    'mother-gift': {
      outcome: [25, 40, 60],
      comment: 'Gift for mother',
    },
    'cash-withdrawal': {
      outcome: 100,
      income: 100,
      comment: 'ATM withdrawal',
    },
    'daily-account-transfer': {
      outcome: [500, 40, 60, 200],
      income: [500, 40, 60, 200],
      comment: 'Transfer to N26',
    },
  },
}

export type TDemoProfile = {
  currency: number
  country: number
  countryCode: string
  merchants: Record<
    keyof typeof englishProfile.merchants,
    { title: string; domain?: string }
  >
  accounts: Record<
    keyof typeof englishProfile.accounts,
    {
      title: string
      instrument: number
      type: AccountType
      company?: number
      balance?: number
    }
  >
  tags: Record<keyof typeof englishProfile.tags, string>
  transactions: Record<
    keyof typeof englishProfile.transactions,
    {
      income?: number | number[]
      outcome?: number | number[]
      comment?: string
    }
  >
  transfers?: {
    id: string
    amount: number
    from: keyof typeof englishProfile.accounts
    to: keyof typeof englishProfile.accounts
    comment: string
  }[]
  companies?: Record<number, { title: string; www: string; fullTitle: string }>
}
