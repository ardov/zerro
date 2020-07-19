import { User, UserId, Instrument, InstrumentId } from 'types'

export function getDataToSave(state: any): any
export function getLastSyncTime(state: any): number
export function getUsers(state: any): { [id: UserId]: User }
export function getRootUser(state: any): User | {}
export function getRootUserId(state: any): UserId | undefined
export function getUserInstrumentId(state: any): string | undefined

export function getInstruments(state: any): { [id: InstrumentId]: Instrument }
export function getInstrument(
  state: any,
  id: InstrumentId
): Instrument | undefined
export function getUserInstrument(state: any): Instrument | undefined
export function getUserInstrument(state: any): string
export function convertCurrency(
  state: any
): (amount: number, from: InstrumentId, to: InstrumentId) => number
