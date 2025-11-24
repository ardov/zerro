import { makeTransaction } from '5-entities/transaction/makeTransaction'
import { toISODate, parseDate } from '6-shared/helpers/date'
import { TAccount, TISODate, TTransaction } from '6-shared/types'

type TPatternValue<T> = T | T[] | ((index: number, date: Date) => T)

type TPattern = {
  since: TISODate // start date
  until?: TISODate // if not provided, current date is used
  repeat: 'daily' | 'monthly' // repeat type
  every: number // repeat every
  offset?: number // days offset from the start date
}

export function generateTransactions(opts: {
  pattern: TPattern

  timeOffset?: TPatternValue<number>
  user: TPatternValue<TTransaction['user']>
  tag?: TPatternValue<TTransaction['tag']>
  outcome?: TPatternValue<TTransaction['outcome']>
  outcomeAccount?: TPatternValue<TAccount>
  income?: TPatternValue<TTransaction['income']>
  incomeAccount?: TPatternValue<TAccount>

  // Optional
  merchant?: TPatternValue<TTransaction['merchant']>
  payee?: TPatternValue<TTransaction['payee']>
  comment?: TPatternValue<TTransaction['comment']>
  opIncome?: TPatternValue<TTransaction['opIncome']>
  opIncomeInstrument?: TPatternValue<TTransaction['opIncomeInstrument']>
  opOutcome?: TPatternValue<TTransaction['opOutcome']>
  opOutcomeInstrument?: TPatternValue<TTransaction['opOutcomeInstrument']>
}): TTransaction[] {
  const { pattern } = opts

  // Convert repeat pattern to frequency
  let frequencyMonths = 0
  let frequencyDays = 0

  if (pattern.repeat === 'daily') frequencyDays = pattern.every
  if (pattern.repeat === 'monthly') frequencyMonths = pattern.every

  if (frequencyMonths === 0 && frequencyDays === 0) return []

  const transactions: TTransaction[] = []

  // Calculate all transaction dates based on frequency and offset
  const startDateObj = parseDate(pattern.since)
  const endDateObj = parseDate(pattern.until || toISODate(new Date()))

  // Apply initial offset
  const firstDate = new Date(startDateObj)
  firstDate.setDate(firstDate.getDate() + (pattern.offset || 0))

  let date = new Date(firstDate)
  let index = 0

  // Generate transactions until we reach the end date
  while (date <= endDateObj) {
    function resolve<T>(pattern: TPatternValue<T>): T {
      if (typeof pattern === 'function') {
        return (pattern as (index: number, date: Date) => T)(index, date)
      }
      if (Array.isArray(pattern)) {
        return pattern[index % pattern.length]
      }
      return pattern as T
    }

    const trDraft = {
      // id
      // changed,
      date: toISODate(date),

      created: +date + resolve(opts.timeOffset || 0),
      user: resolve(opts.user),
      deleted: false,
      hold: false,
      viewed: true,

      qrCode: null,

      income: resolve(opts.income) || 0,
      incomeInstrument: 0,
      incomeAccount: '',
      incomeBankID: null,

      outcome: resolve(opts.outcome) || 0,
      outcomeInstrument: 0,
      outcomeAccount: '',
      outcomeBankID: null,

      opIncome: resolve(opts.opIncome) || null,
      opIncomeInstrument: resolve(opts.opIncomeInstrument) || null,
      opOutcome: resolve(opts.opOutcome) || null,
      opOutcomeInstrument: resolve(opts.opOutcomeInstrument) || null,

      tag: resolve<TTransaction['tag']>(opts.tag || null),
      mcc: null,
      comment: resolve(opts.comment) || null,
      payee: resolve(opts.payee) || null,
      originalPayee: null,
      merchant: resolve(opts.merchant) || null,
      latitude: null,
      longitude: null,
      reminderMarker: null,
    }

    if (!trDraft.income && !trDraft.outcome) {
      throw new Error('No income or outcome provided')
    }

    // INCOME ONLY
    if (trDraft.income && !trDraft.outcome) {
      const incomeAcc = resolve(opts.incomeAccount)
      if (!incomeAcc) {
        throw new Error('No income account provided')
      }
      trDraft.incomeAccount = incomeAcc.id
      trDraft.incomeInstrument = incomeAcc.instrument
      trDraft.outcome = 0
      trDraft.outcomeAccount = incomeAcc.id
      trDraft.outcomeInstrument = incomeAcc.instrument
    }

    // OUTCOME ONLY
    if (trDraft.outcome && !trDraft.income) {
      const outcomeAcc = resolve(opts.outcomeAccount)
      if (!outcomeAcc) {
        throw new Error('No outcome account provided')
      }
      trDraft.outcomeAccount = outcomeAcc.id
      trDraft.outcomeInstrument = outcomeAcc.instrument
      trDraft.income = 0
      trDraft.incomeAccount = outcomeAcc.id
      trDraft.incomeInstrument = outcomeAcc.instrument
    }

    // TRANSFER
    if (trDraft.income && trDraft.outcome) {
      const incomeAcc = resolve(opts.incomeAccount)
      const outcomeAcc = resolve(opts.outcomeAccount)
      if (!incomeAcc || !outcomeAcc) {
        throw new Error('No income or outcome account provided')
      }
      trDraft.incomeAccount = incomeAcc.id
      trDraft.incomeInstrument = incomeAcc.instrument
      trDraft.outcomeAccount = outcomeAcc.id
      trDraft.outcomeInstrument = outcomeAcc.instrument
    }

    // Create transaction
    const transaction = makeTransaction(trDraft)

    transactions.push(transaction)
    index++

    // Calculate next transaction date
    const nextDate = new Date(date)
    nextDate.setMonth(nextDate.getMonth() + frequencyMonths)
    nextDate.setDate(nextDate.getDate() + frequencyDays)
    date = nextDate
  }

  return transactions
}
