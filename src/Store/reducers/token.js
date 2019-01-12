import * as types from '../actionTypes'

export default function tokenReducer(token = null, action = {}) {
  const { type, payload } = action

  switch (type) {
    case types.SET_TOKEN:
      return payload

    default:
      return token
  }
}
