import { combine, createEvent, createStore } from 'effector'
import { unixToISO } from './utils'
import { ById, TFxIdMap, TUser, ZmUser } from '../types'
import { $fxIdMap } from './a_instrument'

// Events
export const setRawUsers = createEvent<ZmUser[]>()

// Store
export const $rawUsers = createStore<ZmUser[]>([])
$rawUsers.on(setRawUsers, (_, rawUsers) => rawUsers)

// Derivatives

export const $users = combine($rawUsers, $fxIdMap, (users, fxIdMap) => {
  let result: ById<TUser> = {}
  users.forEach(raw => {
    result[raw.id] = convertUser(raw, fxIdMap)
  })
  return result
})

export const $mainUser = $users.map(users => {
  let mainUser = Object.values(users).find(({ parent }) => parent === null)
  if (!mainUser) throw new Error('No main user found')
  return mainUser
})

export const $mainUserId = $mainUser.map(user => user.id)

export const $mainUserCurrency = $mainUser.map(user => user.fxCode)

// -----------------------------------------------------------------------------
// Functions
// -----------------------------------------------------------------------------

//** Converts Zm format to local */
function convertUser(raw: ZmUser, fxIdMap: TFxIdMap): TUser {
  return {
    ...raw,
    changed: unixToISO(raw.changed),
    paidTill: unixToISO(raw.paidTill),
    fxCode: fxIdMap[raw.currency],
  }
}
