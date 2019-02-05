import LocalStorage from '../../services/localstorage'

export const saveToLocalStorage = () => (dispatch, getState) => {
  const state = getState()
  LocalStorage.set('data', {
    lastSync: state.lastSync,
    instrument: state.instrument,
    country: state.country,
    company: state.company,
    user: state.user,
    account: state.account,
    tag: state.tag,
    // budget: state.budget,
    merchant: state.merchant,
    reminder: state.reminder,
    reminderMarker: state.reminderMarker,
    transaction: state.transaction
  })
}

export const wipeLocalStorage = () => () => LocalStorage.clear()
