import { getBudgetId } from 'models/data/budgets'
import { TDataStore, TDiff } from 'shared/types'

/**
 * Mutable method
 * @param diff
 * @param store
 */
export function applyDiff(diff: TDiff, store: TDataStore) {
  const {
    serverTimestamp,
    deletion,
    instrument,
    country,
    company,
    user,
    account,
    merchant,
    tag,
    budget,
    reminder,
    reminderMarker,
    transaction,
  } = diff

  const addToStore = (key: keyof TDiff) => (el: any) => {
    if (key === 'serverTimestamp' || key === 'deletion') return
    const id = key === 'budget' ? getBudgetId(el) : el.id
    store[key][id] = el
  }

  if (serverTimestamp) store.serverTimestamp = serverTimestamp
  deletion?.forEach(obj => delete store[obj.object][obj.id])
  instrument?.forEach(addToStore('instrument'))
  country?.forEach(addToStore('country'))
  company?.forEach(addToStore('company'))
  user?.forEach(addToStore('user'))
  account?.forEach(addToStore('account'))
  merchant?.forEach(addToStore('merchant'))
  tag?.forEach(addToStore('tag'))
  budget?.forEach(addToStore('budget'))
  reminder?.forEach(addToStore('reminder'))
  reminderMarker?.forEach(addToStore('reminderMarker'))
  transaction?.forEach(addToStore('transaction'))
}
