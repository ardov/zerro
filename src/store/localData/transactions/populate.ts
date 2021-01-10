import {
  Instrument,
  Modify,
  Tag,
  Transaction,
  TransactionType,
  Account,
} from 'types'
import { mapTags, getType } from './helpers'

interface DataSources {
  instruments: { [id: number]: Instrument }
  accounts: { [id: string]: Account }
  tags: { [id: string]: Tag }
}

export type PopulatedTransaction = Modify<
  Transaction,
  {
    incomeInstrument: Instrument
    incomeAccount: Account
    opIncomeInstrument: Instrument
    outcomeInstrument: Instrument
    outcomeAccount: Account
    opOutcomeInstrument: Instrument
    tag: Tag[] | null
    type: TransactionType
  }
>

export const populate = (
  { instruments, accounts, tags }: DataSources,
  raw: Transaction
) => ({
  ...raw,
  incomeInstrument: instruments[raw.incomeInstrument],
  incomeAccount: accounts[raw.incomeAccount],
  opIncomeInstrument: instruments[Number(raw.opIncomeInstrument)],
  outcomeInstrument: instruments[raw.outcomeInstrument],
  outcomeAccount: accounts[raw.outcomeAccount],
  opOutcomeInstrument: instruments[Number(raw.opOutcomeInstrument)],
  tag: mapTags(raw.tag, tags),
  //COMPUTED PROPERTIES
  type: getType(raw),
})
