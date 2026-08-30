/**
 * Runtime contracts for ZenMoney's wire representation.
 *
 * The adapter owns untrusted JSON at the protocol boundary. Normalized Core
 * entities remain type-only contracts after conversion.
 */
import { z } from 'zod'

const timestamp = z.number().nonnegative()
const numberId = timestamp.int()
const stringId = z.string().min(1)
const nullable = <TSchema extends z.ZodType>(schema: TSchema) =>
  schema.nullable()
const stringArray = z.array(stringId)
const numberArray = z.array(z.number())

const isoDate = z.string().refine(isISODate, 'Expected a calendar ISO date')
const jsonValue: z.ZodType = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValue),
    z.record(z.string(), jsonValue),
  ])
)

export const instrumentWireSchema = z
  .object({
    id: numberId,
    changed: timestamp,
    title: z.string(),
    shortTitle: z.string(),
    symbol: z.string(),
    rate: z.number(),
  })
  .strict()

export const countryWireSchema = z
  .object({
    id: numberId,
    title: z.string(),
    currency: numberId,
    domain: nullable(z.string()),
  })
  .strict()

export const companyWireSchema = z
  .object({
    id: numberId,
    changed: timestamp,
    title: z.string(),
    fullTitle: nullable(z.string()),
    www: nullable(z.string()),
    country: nullable(numberId),
    countryCode: nullable(z.string()),
    deleted: z.boolean(),
  })
  .strict()

export const userWireSchema = z
  .object({
    id: numberId,
    changed: timestamp,
    currency: numberId,
    parent: nullable(numberId),
    country: numberId,
    countryCode: z.string(),
    email: nullable(z.string()),
    login: nullable(z.string()),
    monthStartDay: z.number(),
    isForecastEnabled: z.boolean(),
    planBalanceMode: z.string(),
    planSettings: z.string(),
    paidTill: timestamp,
    subscription: nullable(z.string()),
    subscriptionRenewalDate: jsonValue,
  })
  .strict()

export const merchantWireSchema = z
  .object({
    id: stringId,
    changed: timestamp,
    user: numberId,
    title: z.string(),
  })
  .strict()

export const accountWireSchema = z
  .object({
    id: stringId,
    changed: timestamp,
    user: numberId,
    instrument: numberId,
    title: z.string(),
    role: nullable(z.number()),
    company: nullable(numberId),
    type: z.enum([
      'cash',
      'ccard',
      'checking',
      'loan',
      'deposit',
      'emoney',
      'debt',
    ]),
    syncID: nullable(stringArray),
    balance: z.number(),
    startBalance: z.number(),
    creditLimit: z.number(),
    inBalance: z.boolean(),
    savings: nullable(z.boolean()),
    enableCorrection: z.boolean(),
    balanceCorrectionType: z.literal('request').nullable(),
    enableSMS: z.boolean(),
    archive: z.boolean(),
    private: z.boolean(),
    capitalization: nullable(z.boolean()),
    percent: nullable(z.number()),
    startDate: nullable(isoDate),
    endDateOffset: nullable(z.number()),
    endDateOffsetInterval: z.enum(['day', 'week', 'month', 'year']).nullable(),
    payoffStep: nullable(z.number()),
    payoffInterval: z.enum(['month', 'year']).nullable(),
  })
  .strict()

export const tagWireSchema = z
  .object({
    id: stringId,
    user: numberId,
    changed: timestamp,
    icon: nullable(z.string()),
    budgetIncome: z.boolean(),
    budgetOutcome: z.boolean(),
    archive: nullable(z.boolean()),
    showIncome: z.boolean(),
    showOutcome: z.boolean(),
    title: z.string(),
    parent: nullable(stringId),
    color: nullable(z.number()),
    required: nullable(z.boolean()),
    staticId: nullable(z.string()),
    picture: nullable(z.string()),
  })
  .strict()

export const budgetWireSchema = z
  .object({
    user: numberId,
    changed: timestamp,
    tag: nullable(stringId),
    date: isoDate,
    income: z.number(),
    incomeLock: z.boolean(),
    isIncomeForecast: z.boolean(),
    outcome: z.number(),
    outcomeLock: z.boolean(),
    isOutcomeForecast: z.boolean(),
  })
  .strict()

export const reminderWireSchema = z
  .object({
    id: stringId,
    changed: timestamp,
    user: numberId,
    incomeInstrument: numberId,
    incomeAccount: stringId,
    income: z.number(),
    outcomeInstrument: numberId,
    outcomeAccount: stringId,
    outcome: z.number(),
    tag: nullable(stringArray),
    merchant: nullable(stringId),
    payee: nullable(z.string()),
    comment: nullable(z.string()),
    interval: z.enum(['day', 'week', 'month', 'year']).nullable(),
    step: nullable(z.number()),
    points: nullable(numberArray),
    startDate: isoDate,
    endDate: isoDate,
    notify: z.boolean(),
  })
  .strict()

export const reminderMarkerWireSchema = z
  .object({
    id: stringId,
    changed: timestamp,
    user: numberId,
    incomeInstrument: numberId,
    incomeAccount: stringId,
    income: z.number(),
    outcomeInstrument: numberId,
    outcomeAccount: stringId,
    outcome: z.number(),
    tag: nullable(stringArray),
    merchant: nullable(stringId),
    payee: nullable(z.string()),
    comment: nullable(z.string()),
    date: isoDate,
    reminder: stringId,
    state: z.enum(['planned', 'processed', 'deleted']),
    notify: z.boolean(),
    isForecast: z.boolean().optional(),
  })
  .strict()

export const transactionWireSchema = z
  .object({
    id: stringId,
    changed: timestamp,
    created: timestamp,
    user: numberId,
    deleted: z.boolean(),
    hold: nullable(z.boolean()),
    viewed: z.boolean().optional(),
    source: jsonValue.optional(),
    qrCode: nullable(z.string()),
    incomeBankID: nullable(numberId),
    incomeInstrument: numberId,
    // Nullable only because deleting an account nulls the leg that pointed at
    // it on a soft-deleted debt operation (round 9). The shape rule — a null
    // leg is legal only on a deleted row — is enforced in `hasValidReferences`,
    // which can see `deleted` alongside it.
    incomeAccount: nullable(stringId),
    income: z.number(),
    outcomeBankID: nullable(numberId),
    outcomeInstrument: numberId,
    outcomeAccount: nullable(stringId),
    outcome: z.number(),
    tag: nullable(stringArray),
    merchant: nullable(stringId),
    payee: nullable(z.string()),
    originalPayee: nullable(z.string()),
    comment: nullable(z.string()),
    date: isoDate,
    mcc: nullable(z.number()).optional(),
    reminderMarker: nullable(stringId),
    opIncome: nullable(z.number()),
    opIncomeInstrument: nullable(numberId),
    opOutcome: nullable(z.number()),
    opOutcomeInstrument: nullable(numberId),
    latitude: nullable(z.number()),
    longitude: nullable(z.number()),
  })
  .strict()

const deletionWireSchema = z
  .object({
    id: z.union([stringId, numberId]),
    object: z.enum([
      'instrument',
      'country',
      'company',
      'user',
      'merchant',
      'account',
      'tag',
      'budget',
      'reminder',
      'reminderMarker',
      'transaction',
    ]),
    stamp: timestamp,
    user: numberId,
  })
  .strict()

/** A partial server response or request diff. */
export const zenMoneyDiffWireSchema = z
  .object({
    serverTimestamp: timestamp,
    deletion: z.array(deletionWireSchema).optional(),
    instrument: z.array(instrumentWireSchema).optional(),
    country: z.array(countryWireSchema).optional(),
    company: z.array(companyWireSchema).optional(),
    user: z.array(userWireSchema).optional(),
    merchant: z.array(merchantWireSchema).optional(),
    account: z.array(accountWireSchema).optional(),
    tag: z.array(tagWireSchema).optional(),
    budget: z.array(budgetWireSchema).optional(),
    reminder: z.array(reminderWireSchema).optional(),
    reminderMarker: z.array(reminderMarkerWireSchema).optional(),
    transaction: z.array(transactionWireSchema).optional(),
  })
  .strict()

export type TZenMoneyWireDiff = z.output<typeof zenMoneyDiffWireSchema>

function isISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  )
}
