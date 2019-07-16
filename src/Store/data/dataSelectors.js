import { getBudgetsToSync } from 'store/data/budgets'
import { getTransactionsToSync } from 'store/data/transactions'

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

// SELECTOR

export const getDataToSave = state => ({
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
})

export const getChangedArrays = state => ({
  transaction: getTransactionsToSync(state),
  budget: getBudgetsToSync(state),
})

export const getChangedNum = state => {
  const arrays = getChangedArrays(state)
  return Object.values(arrays).flat().length
}

export const getLastChangeTime = state => {
  const arrays = getChangedArrays(state)
  const lastChange = Object.values(arrays)
    .flat()
    .reduce(
      (lastChange, item) =>
        item.changed > lastChange ? item.changed : lastChange,
      0
    )
  return new Date(lastChange)
}
