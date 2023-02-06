import { TrType } from '@entities/transaction'
import { getType } from '@entities/transaction/helpers'
import {
  ByIdOld,
  Modify,
  TAccount,
  TInstrument,
  TTag,
  TTagId,
  TTransaction,
} from '@shared/types'

interface DataSources {
  instruments: { [id: number]: TInstrument }
  accounts: { [id: string]: TAccount }
  tags: { [id: string]: TTag }
}

export type PopulatedTransaction = Modify<
  TTransaction,
  {
    incomeInstrument: TInstrument
    incomeAccount: TAccount
    opIncomeInstrument: TInstrument
    outcomeInstrument: TInstrument
    outcomeAccount: TAccount
    opOutcomeInstrument: TInstrument
    tag: TTag[] | null
    type: TrType
  }
>

export const populateTransaction = (
  { instruments, accounts, tags }: DataSources,
  raw: TTransaction
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

function mapTags(ids: TTagId[] | null, tags: ByIdOld<TTag>) {
  // TODO: Надо что-то придумать с null тегом 🤔    ⤵
  return ids && ids.length ? ids.map(id => tags[id + '']) : null
}
