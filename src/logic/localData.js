import LocalStorage from 'services/localstorage'
import { getBudgetsToSave } from 'store/data/budgets/'
import { getTransactionsToSave } from 'store/data/transactions'
import { getInstrumentsToSave } from 'store/data/instruments'
import { getMerchantsToSave } from 'store/data/merchants'
import { getUsersToSave } from 'store/data/users'
import { getServerTimestampToSave } from 'store/data/serverTimestamp'
import { getAccountsToSave } from 'store/data/accounts'
import { getTagsToSave } from 'store/data/tags'
import { getCountriesToSave } from 'store/data/_countries'
import { getCompaniesToSave } from 'store/data/_companies'
import { getRemindersToSave } from 'store/data/_reminders'
import { getReminderMarkersToSave } from 'store/data/_reminderMarkers'
import { updateData } from 'store/data/commonActions'

export const saveDataLocally = () => (dispatch, getState) => {
  const state = getState()
  const dataToSave = {
    serverTimestamp: getServerTimestampToSave(state),
    instrument: getInstrumentsToSave(state),
    user: getUsersToSave(state),
    merchant: getMerchantsToSave(state),
    country: getCountriesToSave(state),
    company: getCompaniesToSave(state),
    reminder: getRemindersToSave(state),
    reminderMarker: getReminderMarkersToSave(state),
    account: getAccountsToSave(state),
    tag: getTagsToSave(state),
    budget: getBudgetsToSave(state),
    transaction: getTransactionsToSave(state),
  }
  LocalStorage.set('data', dataToSave)
}

export const loadLocalData = () => (dispatch, getState) =>
  new Promise(resolve => {
    const data = LocalStorage.get('data')
    if (data) dispatch(updateData(data))

    resolve()
  })
