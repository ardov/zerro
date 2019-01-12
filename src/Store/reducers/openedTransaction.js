import * as types from '../actionTypes'

export default function openedTransaction(opened = null, action = {}) {
  const { type, payload } = action

  switch (type) {
    case types.TRANSACTION_OPEN:
      return payload

    default:
      return opened
  }
}
