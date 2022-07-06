import { TrType } from 'models/transaction'
import { getType } from 'models/transaction/helpers'
import {
  ByIdOld,
  Modify,
  IAccount,
  IInstrument,
  ITag,
  TTagId,
  ITransaction,
} from 'shared/types'

interface DataSources {
  instruments: { [id: number]: IInstrument }
  accounts: { [id: string]: IAccount }
  tags: { [id: string]: ITag }
}

export type PopulatedTransaction = Modify<
  ITransaction,
  {
    incomeInstrument: IInstrument
    incomeAccount: IAccount
    opIncomeInstrument: IInstrument
    outcomeInstrument: IInstrument
    outcomeAccount: IAccount
    opOutcomeInstrument: IInstrument
    tag: ITag[] | null
    type: TrType
  }
>

export const populateTransaction = (
  { instruments, accounts, tags }: DataSources,
  raw: ITransaction
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

function mapTags(ids: TTagId[] | null, tags: ByIdOld<ITag>) {
  // TODO: Надо что-то придумать с null тегом 🤔    ⤵
  return ids && ids.length ? ids.map(id => tags[id + '']) : null
}
