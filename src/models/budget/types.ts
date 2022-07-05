import { TBudget, TInstrumentId } from 'shared/types'

export type TPopulatedBudget = TBudget & {
  convertedOutcome: number
  instrument: TInstrumentId | null
}
