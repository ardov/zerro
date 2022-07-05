import { TAccountPopulated } from './types'
import { isInBudget } from './helpers'
import { TAccount } from 'shared/types'

interface Options {
  convert: (
    amount: number | undefined,
    from: number,
    to?: number | undefined
  ) => number
}

export const populate = (
  { convert }: Options,
  raw: TAccount
): TAccountPopulated => {
  return {
    ...raw,
    convertedBalance: convert(raw.balance, raw.instrument),
    convertedStartBalance: convert(raw.startBalance, raw.instrument),
    inBudget: isInBudget(raw),
  }
}
