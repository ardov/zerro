import { core } from 'zerro-core/redux'
import type {
  ByIdOld,
  Modify,
  TAccount,
  TInstrument,
  TTag,
  TTagId,
  TTransaction,
} from '6-shared/types'

interface DataSources {
  instruments: { [id: number]: TInstrument }
  accounts: { [id: string]: TAccount }
  tags: { [id: string]: TTag }
}

export type PopulatedTransaction = Modify<
  TTransaction,
  {
    incomeInstrument: TInstrument
    incomeAccount: TAccount | undefined
    opIncomeInstrument: TInstrument
    outcomeInstrument: TInstrument
    outcomeAccount: TAccount | undefined
    opOutcomeInstrument: TInstrument
    tag: TTag[] | null
    type: core.transactions.TrType
  }
>

export const populateTransaction = (
  { instruments, accounts, tags }: DataSources,
  raw: TTransaction
) => ({
  ...raw,
  incomeInstrument: instruments[raw.incomeInstrument],
  incomeAccount: raw.incomeAccount ? accounts[raw.incomeAccount] : undefined,
  opIncomeInstrument: instruments[Number(raw.opIncomeInstrument)],
  outcomeInstrument: instruments[raw.outcomeInstrument],
  outcomeAccount: raw.outcomeAccount ? accounts[raw.outcomeAccount] : undefined,
  opOutcomeInstrument: instruments[Number(raw.opOutcomeInstrument)],
  tag: mapTags(raw.tag, tags),
  //COMPUTED PROPERTIES
  type: core.transactions.getType(raw),
})

function mapTags(ids: TTagId[] | null, tags: ByIdOld<TTag>) {
  // TODO: Надо что-то придумать с null тегом 🤔    ⤵
  return ids && ids.length ? ids.map(id => tags[id + '']) : null
}
