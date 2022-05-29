import { combine, createEvent, createStore } from 'effector'
import { ById, TFxIdMap, TReminder, ZmReminder } from '../types'
import { $fxIdMap } from './instrument'
import { unitsToMilliunits, unixToISO } from './utils'

// Events
export const setRawReminders = createEvent<ZmReminder[]>()

// Store
export const $rawReminders = createStore<ZmReminder[]>([])
$rawReminders.on(setRawReminders, (_, rawReminders) => rawReminders)

// Derivatives

export const $reminders = combine(
  $rawReminders,
  $fxIdMap,
  (rawReminders, fxIdMap) => {
    let result: ById<TReminder> = {}
    rawReminders.forEach(raw => {
      result[raw.id] = convertReminder(raw, fxIdMap)
    })
    return result
  }
)

// -----------------------------------------------------------------------------
// Functions
// -----------------------------------------------------------------------------

//** Converts Zm format to local */
function convertReminder(raw: ZmReminder, fxIdMap: TFxIdMap): TReminder {
  return {
    ...raw,
    changed: unixToISO(raw.changed),
    income: unitsToMilliunits(raw.income),
    outcome: unitsToMilliunits(raw.outcome),
    incomeFxCode: fxIdMap[raw.incomeInstrument],
    outcomeFxCode: fxIdMap[raw.outcomeInstrument],
  }
}
