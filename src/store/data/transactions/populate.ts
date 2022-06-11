import {
  TInstrument,
  Modify,
  Tag,
  Transaction,
  TTransactionType,
  Account,
  TTagId,
  ById,
} from 'types'
import { getType } from './helpers'

interface DataSources {
  instruments: { [id: number]: TInstrument }
  accounts: { [id: string]: Account }
  tags: { [id: string]: Tag }
}

export type PopulatedTransaction = Modify<
  Transaction,
  {
    incomeInstrument: TInstrument
    incomeAccount: Account
    opIncomeInstrument: TInstrument
    outcomeInstrument: TInstrument
    outcomeAccount: Account
    opOutcomeInstrument: TInstrument
    tag: Tag[] | null
    type: TTransactionType
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

function mapTags(ids: TTagId[] | null, tags: ById<Tag>) {
  // TODO: Надо что-то придумать с null тегом 🤔    ⤵
  return ids && ids.length ? ids.map(id => tags[id + '']) : null
}
