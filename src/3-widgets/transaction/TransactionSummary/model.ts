import { addDays, addMonths, addYears } from 'date-fns'
import type {
  TAccountId,
  TFxCode,
  TISODate,
  TTransaction,
} from '@/6-shared/types'
import { parseDate, toISODate } from '@/6-shared/helpers/date'
import { round } from '@/6-shared/helpers/money/currencyHelpers'
import { core } from '@/zerro-core/redux'

/** Money in, money out, a debt either way, or a move between own accounts. */
export type TFlow = 'income' | 'outcome' | 'debt' | 'transfer'
/** What a breakdown or a timeline is about. Debts and transfers have none. */
export type TSide = 'income' | 'outcome'
export type TDimension = 'category' | 'place' | 'account' | 'currency'
export type TStep = 'day' | 'week' | 'month' | 'year'

/** What the summary was last switched to. It is kept with the list's view,
 * so it comes back from history and outlives the transactions it was chosen
 * for: every value is checked against what the summary can offer now. */
export type TSummaryChoices = Partial<
  Record<'side' | 'dimension' | 'step' | 'currency', string>
>

export type TSummaryContext = {
  debtAccountId: TAccountId | undefined
  currencyOf: (instrument: number) => TFxCode
  /** What one unit of `from` is worth in `to` on that date. */
  rate: (from: TFxCode, to: TFxCode, date: TISODate) => number
}

export type TEntry = {
  transaction: TTransaction
  flow: TFlow
  /** Signed, in its own currency. A transfer carries what left, unsigned. */
  amount: number
  currency: TFxCode
  /** The same amount in the summary's currency. */
  value: number
}

export type TFlowTotal = {
  flow: TFlow
  value: number
  /** Exact sums, one per currency, largest first. */
  native: { currency: TFxCode; amount: number }[]
}

export type TSummary = {
  count: number
  range: { from: TISODate; to: TISODate } | null
  /** Every currency met, most used first. */
  currencies: TFxCode[]
  /** The currency values are in: the only one met, or the one asked for. */
  currency: TFxCode
  /** Several currencies were met, so values are an estimate at past rates. */
  converted: boolean
  flows: TFlowTotal[]
  /** Income, outcome and debts together. Null when only one of them is here;
   * transfers move money between own accounts and never count. */
  net: number | null
  /** Sides present. Spending is what a summary is most often read for. */
  sides: TSide[]
  entries: TEntry[]
}

const flowOrder: TFlow[] = ['income', 'outcome', 'debt', 'transfer']

/** Counts exactly the given transactions, by their own type. */
export function summarize(
  transactions: readonly TTransaction[],
  target: TFxCode,
  ctx: TSummaryContext
): TSummary {
  const { TrType } = core.transactions
  const raw = transactions.map(transaction => {
    const type = core.transactions.getType(transaction, ctx.debtAccountId)
    const incoming = type === TrType.Income || type === TrType.IncomeDebt
    const flow: TFlow =
      type === TrType.Transfer
        ? 'transfer'
        : type === TrType.Income
          ? 'income'
          : type === TrType.Outcome
            ? 'outcome'
            : 'debt'
    return {
      transaction,
      flow,
      amount:
        flow === 'transfer'
          ? transaction.outcome
          : incoming
            ? transaction.income
            : -transaction.outcome,
      currency: ctx.currencyOf(
        incoming ? transaction.incomeInstrument : transaction.outcomeInstrument
      ),
    }
  })

  const usage = new Map<TFxCode, number>()
  raw.forEach(({ currency }) =>
    usage.set(currency, (usage.get(currency) ?? 0) + 1)
  )
  const currencies = [...usage.keys()].sort(
    (a, b) => usage.get(b)! - usage.get(a)!
  )
  const converted = currencies.length > 1
  const currency = converted ? target : (currencies[0] ?? target)

  const entries: TEntry[] = raw.map(entry => ({
    ...entry,
    value: converted
      ? entry.amount *
        ctx.rate(entry.currency, currency, entry.transaction.date)
      : entry.amount,
  }))

  const flows = flowOrder
    .map(flow => entries.filter(entry => entry.flow === flow))
    .filter(group => group.length)
    .map(group => {
      const native = new Map<TFxCode, number>()
      group.forEach(entry =>
        native.set(
          entry.currency,
          (native.get(entry.currency) ?? 0) + entry.amount
        )
      )
      return {
        flow: group[0].flow,
        value: sum(group),
        native: [...native]
          .map(([currency, amount]) => ({ currency, amount: round(amount) }))
          .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)),
      }
    })

  const money = flows.filter(total => total.flow !== 'transfer')
  const dates = transactions.map(transaction => transaction.date).sort()
  return {
    count: transactions.length,
    range: dates.length ? { from: dates[0], to: dates.at(-1)! } : null,
    currencies,
    currency,
    converted,
    flows,
    net:
      money.length > 1
        ? round(money.reduce((total, flow) => total + flow.value, 0))
        : null,
    sides: (['outcome', 'income'] as const).filter(side =>
      flows.some(total => total.flow === side)
    ),
    entries,
  }
}

export type TGroup = {
  /** Stable within its dimension. A place is `m:<merchant id>` or
   * `p:<normalized payee>`. */
  key: string
  value: number
  count: number
  /** Any member, for what the key alone cannot name: a payee as it was typed. */
  sample: TTransaction
}

const NONE = ''

function getGroupKey(entry: TEntry, dimension: TDimension): string {
  const { transaction } = entry
  switch (dimension) {
    case 'category':
      return transaction.tag?.[0] ?? 'null'
    case 'place': {
      if (transaction.merchant) return `m:${transaction.merchant}`
      const payee = core.merchants.normalizePayee(transaction.payee)
      return payee ? `p:${payee}` : NONE
    }
    case 'account':
      return (
        (entry.amount > 0
          ? transaction.incomeAccount
          : transaction.outcomeAccount) ?? NONE
      )
    case 'currency':
      return entry.currency
  }
}

/** One side's entries, grouped and sorted with the largest first. */
export function getBreakdown(
  entries: readonly TEntry[],
  dimension: TDimension
): TGroup[] {
  const groups = new Map<string, { members: TEntry[] }>()
  entries.forEach(entry => {
    const key = getGroupKey(entry, dimension)
    const group = groups.get(key)
    if (group) group.members.push(entry)
    else groups.set(key, { members: [entry] })
  })
  return [...groups]
    .map(([key, { members }]) => ({
      key,
      value: Math.abs(sum(members)),
      count: members.length,
      sample: members[0].transaction,
    }))
    .sort((a, b) => b.value - a.value)
}

const dimensions: TDimension[] = ['category', 'place', 'account', 'currency']

/** A dimension is worth offering when it splits at least one of the lists.
 * Each side is a list: what splits spending is offered for income too, so the
 * choice does not come and go with the side being looked at. */
export function getDimensions(...lists: (readonly TEntry[])[]): TDimension[] {
  return dimensions.filter(dimension =>
    lists.some(entries => {
      const first = entries[0] && getGroupKey(entries[0], dimension)
      return entries.some(entry => getGroupKey(entry, dimension) !== first)
    })
  )
}

export type TBucket = {
  from: TISODate
  to: TISODate
  value: number
  /** How many entries fell into the period. */
  count: number
  /** The period is not over yet, so it holds less than it will. */
  ongoing: boolean
}

const steps: TStep[] = ['day', 'week', 'month', 'year']
/** More bars than this stop reading as a chart in a side panel. */
const MAX_BUCKETS = 60
/** The finest step that still fits this many bars opens the timeline. */
const COMFORTABLE_BUCKETS = 31

function bucketStart(date: TISODate, step: TStep): TISODate {
  if (step === 'year') return `${date.slice(0, 4)}-01-01` as TISODate
  if (step === 'month') return `${date.slice(0, 7)}-01` as TISODate
  if (step === 'day') return date
  const day = parseDate(date)
  // Weeks start on Monday.
  return toISODate(addDays(day, -((day.getDay() + 6) % 7)))
}

function nextBucket(start: TISODate, step: TStep): TISODate {
  const date = parseDate(start)
  if (step === 'year') return toISODate(addYears(date, 1))
  if (step === 'month') return toISODate(addMonths(date, 1))
  return toISODate(addDays(date, step === 'week' ? 7 : 1))
}

/** Every period from the first day of `span` to its last, empty ones
 * included, holding what `entries` put there. One side is drawn over the span of both,
 * so switching sides keeps every period where it was. */
export function getTimeline(
  entries: readonly TEntry[],
  step: TStep,
  span: readonly TEntry[] = entries,
  today?: TISODate
): TBucket[] {
  if (!span.length) return []
  const totals = new Map<TISODate, { value: number; count: number }>()
  entries.forEach(entry => {
    const start = bucketStart(entry.transaction.date, step)
    const total = totals.get(start) ?? { value: 0, count: 0 }
    total.value += entry.value
    total.count++
    totals.set(start, total)
  })
  let first = span[0].transaction.date
  let last = first
  span.forEach(({ transaction: { date } }) => {
    if (date < first) first = date
    if (date > last) last = date
  })
  const end = bucketStart(last, step)
  const buckets: TBucket[] = []
  let start = bucketStart(first, step)
  while (start <= end && buckets.length <= MAX_BUCKETS) {
    const next = nextBucket(start, step)
    const total = totals.get(start)
    const until = toISODate(addDays(parseDate(next), -1))
    buckets.push({
      // Cut to the days the span covers: choosing a period only ever narrows
      // a list, even when a week or a month reaches past its dates.
      from: start < first ? first : start,
      to: until > last ? last : until,
      value: Math.abs(round(total?.value ?? 0)),
      count: total?.count ?? 0,
      ongoing: today !== undefined && start <= today && today < until,
    })
    start = next
  }
  return buckets
}

/** Steps that give a readable chart, and the one to open with. Entries that
 * all fall on one day still get that day: there is always a step to draw. */
export function getSteps(span: readonly TEntry[]): {
  available: TStep[]
  initial: TStep
} {
  const sizes = steps.map(step => getTimeline(span, step).length)
  const available = steps.filter(
    (_, index) => sizes[index] >= 2 && sizes[index] <= MAX_BUCKETS
  )
  if (!available.length) return { available: ['day'], initial: 'day' }
  const initial =
    available.find(step => sizes[steps.indexOf(step)] <= COMFORTABLE_BUCKETS) ??
    available.at(-1)!
  return { available, initial }
}

/** Fewer periods with anything in them say nothing a short list does not. */
const MIN_FILLED = 3

/** Whether a timeline has something to say about these entries. Judged on
 * the finest step on offer, never on the one being looked at: a coarser step
 * only ever merges periods, and choosing one must not take the chart away. */
export function isSpreadOverTime(span: readonly TEntry[]): boolean {
  const finest = getSteps(span).available[0]
  const filled = getTimeline(span, finest).filter(bucket => bucket.count)
  return filled.length >= MIN_FILLED
}

function sum(entries: readonly TEntry[]) {
  return round(entries.reduce((total, entry) => total + entry.value, 0))
}
