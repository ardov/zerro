import serverData from './serverData'
import openedTransaction from './openedTransaction'
import filter from './filter'

const reducer = (state, action) => {
  return {
    ...serverData(state, action),
    openedTransaction: openedTransaction(state.openedTransaction, action),
    filterConditions: filter(state.filterConditions, action)
  }
}

export default reducer
