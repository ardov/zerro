import { IAccountPopulated } from './types'
import { isInBudget } from './helpers'
import { ById, TAccount, TInstrument } from '@shared/types'

interface Options {
  convert: (
    amount: number | undefined,
    from: number
    // to?: number | undefined
  ) => number
  instruments: ById<TInstrument>
}

export const populate = (
  { convert, instruments }: Options,
  raw: TAccount
): IAccountPopulated => {
  return {
    ...raw,
    convertedBalance: convert(raw.balance, raw.instrument),
    convertedStartBalance: convert(raw.startBalance, raw.instrument),
    inBudget: isInBudget(raw),
    fxCode: instruments[raw.instrument].shortTitle,
  }
}
