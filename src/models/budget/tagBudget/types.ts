import { IBudget, TInstrumentId } from 'shared/types'

export type TPopulatedBudget = IBudget & {
  convertedOutcome: number
  instrument: TInstrumentId | null
}
