import { Account, PopulatedAccount } from 'types'

interface Options {
  convert: (
    amount: number | undefined,
    from: number,
    to?: number | undefined
  ) => number
}

export const populate = (
  { convert }: Options,
  raw: Account
): PopulatedAccount => {
  return {
    ...raw,
    convertedBalance: convert(raw.balance, raw.instrument),
    convertedStartBalance: convert(raw.startBalance, raw.instrument),
    inBudget: isInBudget(raw),
  }
}

function isInBudget(a: Account) {
  if (a.type === 'debt') return false
  if (a.title.endsWith('📍')) return true
  return a.inBalance
}
