import { ById, TMerchant, ZmMerchant } from '../types'
import { unixToISO } from './utils'
import { dataDomain } from './domain'

// Events
export const setRawMerchants = dataDomain.createEvent<ZmMerchant[]>()

// Store
export const $rawMerchants = dataDomain.createStore<ZmMerchant[]>([])
$rawMerchants.on(setRawMerchants, (_, rawMerchants) => rawMerchants)

// Derivatives

export const $merchants = $rawMerchants.map(merchants => {
  let result: ById<TMerchant> = {}
  merchants.forEach(raw => {
    result[raw.id] = convertMerchant(raw)
  })
  return result
})

// -----------------------------------------------------------------------------
// Functions
// -----------------------------------------------------------------------------

function convertMerchant(raw: ZmMerchant): TMerchant {
  return { ...raw, changed: unixToISO(raw.changed) }
}
