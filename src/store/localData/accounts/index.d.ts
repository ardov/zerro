import { AccountId, Account } from 'types'

export function getAccounts(state: any): { [id: AccountId]: Account }
export function getAccount(state: any): Account | undefined
export function getAccountsToSync(state: any): Account[]
export function getAccountList(state: any): Account[]
export function getCredits(state: any): Account[]
export function getAccountsInBudget(state: any): Account[]
export function getSavingAccounts(state: any): Account[]
