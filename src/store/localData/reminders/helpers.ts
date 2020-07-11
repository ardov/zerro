import { v1 as uuidv1 } from 'uuid'

interface Reminder {
  user: number
  incomeAccount: string
  outcomeAccount: string

  id: string
  changed: number

  incomeInstrument: number
  income: number
  outcomeInstrument: number
  outcome: number

  tag: string | string[] | null
  merchant: string | null
  payee: string | null
  comment: string | null

  interval: 'day' | 'week' | 'month' | 'year' | null
  step: number
  points: number[]
  startDate: number
  endDate: number
  notify: boolean
}

export const makeReminder = (
  raw: Partial<Reminder> & {
    user: number
    incomeAccount: string
    outcomeAccount: string
  }
): Reminder => ({
  // Required
  user: raw.user,
  incomeAccount: raw.incomeAccount,
  outcomeAccount: raw.outcomeAccount,

  // Optional
  id: raw.id || uuidv1(),
  changed: raw.changed || Date.now(),

  incomeInstrument: raw.incomeInstrument || 2,
  income: raw.income || 0,
  outcomeInstrument: raw.outcomeInstrument || 2,
  outcome: raw.outcome || 0,

  tag: raw.tag || null,
  merchant: raw.merchant || null,
  payee: raw.payee || null,
  comment: raw.comment || null,

  interval: raw.interval || null,
  step: raw.step || 0,
  points: raw.points || [0],
  startDate: raw.startDate || Date.now(),
  endDate: raw.endDate || Date.now(),
  notify: raw.notify || false,
})
