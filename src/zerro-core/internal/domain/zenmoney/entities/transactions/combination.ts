import { MoneyDecimal } from '../../../foundation/decimal'
import type { ById } from '../../../foundation/types'
import type { TInstrument } from '../instruments'
import { getTransactionType, isDeletedTransaction, TrType } from './read'
import type { TTransaction } from './types'

/** Net posting amount in a single instrument, including all four stored decimals. */
export function getPostingNet(
  incomes: TTransaction[],
  outcomes: TTransaction[]
) {
  const instrument = outcomes[0]?.outcomeInstrument
  if (
    !incomes.length ||
    !outcomes.length ||
    incomes.some(tr => tr.incomeInstrument !== instrument) ||
    outcomes.some(tr => tr.outcomeInstrument !== instrument)
  ) {
    throw new Error(
      'Combining income and expenses requires a single instrument'
    )
  }
  let net = new MoneyDecimal(0)
  for (const tr of incomes) net = net.plus(tr.income)
  for (const tr of outcomes) net = net.minus(tr.outcome)
  return net
}

export function getTransactionCombination(
  transactions: TTransaction[],
  instruments: ById<TInstrument>
) {
  const incomes: TTransaction[] = []
  const outcomes: TTransaction[] = []
  const accounts = new Set<string | null>()
  const instrumentIds = new Set<number>()
  for (const tr of transactions) {
    if (isDeletedTransaction(tr)) return null
    const type = getTransactionType(tr)
    if (type === TrType.Income) {
      incomes.push(tr)
      accounts.add(tr.incomeAccount)
      instrumentIds.add(tr.incomeInstrument)
    } else if (type === TrType.Outcome) {
      outcomes.push(tr)
      accounts.add(tr.outcomeAccount)
      instrumentIds.add(tr.outcomeInstrument)
    } else return null
  }
  if (!incomes.length || !outcomes.length) return null
  const pair = incomes.length === 1 && outcomes.length === 1

  if (instrumentIds.size === 1) {
    const net = getPostingNet(incomes, outcomes)
    if (net.isZero()) {
      if (accounts.size === 1) return 'collapse'
      return pair ? 'transfer' : null
    }
    if (net.decimalPlaces() > 4) return null
    if (net.isPositive() && incomes.length === 1) return 'income'
    if (net.isNegative() && outcomes.length === 1) return 'outcome'
    return null
  }

  if (!pair || accounts.size === 1) return null
  const income = incomes[0]
  const outcome = outcomes[0]
  const inRate = instruments[income.incomeInstrument]?.rate
  const outRate = instruments[outcome.outcomeInstrument]?.rate
  if (
    !(inRate > 0 && outRate > 0) ||
    !Number.isFinite(inRate) ||
    !Number.isFinite(outRate)
  )
    return null

  const received = new MoneyDecimal(income.income).times(inRate)
  const sent = new MoneyDecimal(outcome.outcome).times(outRate)
  const larger = received.gte(sent) ? received : sent
  // Transactions in different instruments may differ by up to 15% in value.
  return received.minus(sent).abs().lte(larger.times(0.15)) ? 'transfer' : null
}
