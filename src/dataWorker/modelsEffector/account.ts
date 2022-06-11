import { combine } from 'effector'
import { $fxIdMap } from './instrument'
import { ById, TAccount, TFxIdMap, ZmAccount } from '../types'
import { unitsToMilliunits, unixToISO } from './utils'
import { dataDomain } from './domain'

// Events
export const setRawAccounts = dataDomain.createEvent<ZmAccount[]>()

// Store
export const $rawAccounts = dataDomain.createStore<ZmAccount[]>([])
$rawAccounts.on(setRawAccounts, (_, rawAccounts) => rawAccounts)

// Derivatives

export const $debtAccountId = $rawAccounts.map(rawAccounts => {
  const debtAccount = rawAccounts.find(acc => acc.type === 'debt')
  if (!debtAccount) throw new Error('No debt account found')
  return debtAccount.id
})

export const $accounts = combine($rawAccounts, $fxIdMap, (users, fxIdMap) => {
  let result: ById<TAccount> = {}
  users.forEach(raw => {
    result[raw.id] = convertAccount(raw, fxIdMap)
  })
  return result
})

// -----------------------------------------------------------------------------
// Functions
// -----------------------------------------------------------------------------

function isInBudget(acc: ZmAccount): boolean {
  if (acc.type === 'debt') return false
  if (acc.title.endsWith('📍')) return true
  return acc.inBalance
}

function convertAccount(raw: ZmAccount, fxIdMap: TFxIdMap): TAccount {
  return {
    ...raw,
    changed: unixToISO(raw.changed),
    balance: unitsToMilliunits(raw.balance),
    startBalance: unitsToMilliunits(raw.startBalance),
    creditLimit: unitsToMilliunits(raw.creditLimit),
    inBudget: isInBudget(raw),
    fxCode: fxIdMap[raw.instrument],
  }
}
