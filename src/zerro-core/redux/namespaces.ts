/**
 * The Redux adapter's domain namespaces. `index.ts` re-exports these grouped
 * as the single `core` namespace. Add one here when a consumer needs it, not
 * in advance; cross-domain memoization wiring stays internal.
 */
export * as accounts from './accounts'
export * as activity from './activity'
export * as balances from './balances'
export * as budgets from './budgets'
export * as currency from './currency'
export * as debtors from './debtors'
export * as envelopes from './envelopes'
export * as fxRates from './fxRates'
export * as goals from './goals'
export * as infrastructure from './infrastructure'
export * as instruments from './instruments'
export * as merchants from './merchants'
export * as months from './months'
export * as reminders from './reminders'
export * as settings from './settings'
export * as tags from './tags'
export * as transactions from './transactions'
export * as users from './users'
