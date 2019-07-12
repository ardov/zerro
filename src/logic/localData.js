import LocalStorage from 'services/localstorage'
import { getBudgetsToSave } from 'store/data/budgets/'
import { getTransactionsToSave } from 'store/data/transactions'
import { getInstruments } from 'store/data/instruments'
import { getMerchants } from 'store/data/merchants'
import { getUsers } from 'store/data/users'
import { getLastSyncTime } from 'store/data/serverTimestamp'
import { getAccountsToSave } from 'store/data/accounts'
import { getTagsToSave } from 'store/data/tags'
import { getCountries } from 'store/data/_countries'
import { getCompanies } from 'store/data/_companies'
import { getReminders } from 'store/data/_reminders'
import { getReminderMarkers } from 'store/data/_reminderMarkers'

export const saveDataLocally = () => (dispatch, getState) => {
  const state = getState()
  const dataToSave = {
    serverTimestamp: getLastSyncTime(state),
    instrument: getInstruments(state),
    user: getUsers(state),
    merchant: getMerchants(state),
    country: getCountries(state),
    company: getCompanies(state),
    reminder: getReminders(state),
    reminderMarker: getReminderMarkers(state),

    account: getAccountsToSave(state),
    tag: getTagsToSave(state),
    budget: getBudgetsToSave(state),
    transaction: getTransactionsToSave(state),
  }
  LocalStorage.set('data', dataToSave)
}

export const getDataFromLS = () => {
  const data = LocalStorage.get('data')
  return {
    ...data,
    account: data.account,
    tag: data.tag,
    budget: data.budget,
    transaction: data.transaction,
  }
}
