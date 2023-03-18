import { useAppSelector } from '@store'
import { getInstruments, getInstrumentsByCode, getInstCodeMap } from './model'

export type { TInstCodeMap } from './model'

export const instrumentModel = {
  // Selectors
  getInstruments,
  getInstrumentsByCode,
  getInstCodeMap,

  // Hooks
  useInstruments: () => useAppSelector(getInstruments),
  useInstrumentsByCode: () => useAppSelector(getInstrumentsByCode),
  useInstCodeMap: () => useAppSelector(getInstCodeMap),
}
