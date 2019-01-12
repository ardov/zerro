import serverData from './serverData'
import openedTransaction from './openedTransaction'
import filter from './filter'
import token from './token'

const reducer = (state, action) => {
  return {
    ...serverData(state, action),
    openedTransaction: openedTransaction(state.openedTransaction, action),
    filterConditions: filter(state.filterConditions, action),
    token: token(state.token, action)
  }
}

export default reducer
