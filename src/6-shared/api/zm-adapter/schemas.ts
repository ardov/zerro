/**
 * Runtime contracts for ZenMoney's wire representation.
 *
 * The adapter owns untrusted JSON at the protocol boundary. Normalized Core
 * entities remain type-only contracts after conversion.
 */
import { z } from 'zod'
import type { TDataEntityKey, TOpenEnum } from '6-shared/types'
import {
  accountOffsetIntervals,
  accountPayoffIntervals,
  accountTypes,
  balanceCorrectionTypes,
  reminderIntervals,
  reminderMarkerStates,
} from '6-shared/types'

const timestamp = z.number().nonnegative()
const numberId = timestamp.int()
const stringId = z.string().min(1)
const nullable = <TSchema extends z.ZodType>(schema: TSchema) =>
  schema.nullable()
const stringArray = z.array(stringId)
const numberArray = z.array(z.number())

const isoDate = z.string().refine(isISODate, 'Expected a calendar ISO date')

/**
 * Discriminators ZenMoney owns, by the wire path that carries them. Unknown
 * values parse — a complete backup has to stay importable when the server
 * learns a new account type — so this table is both what the schema accepts
 * with a known meaning and what the import seam reports against.
 */
export const knownWireValues = {
  'account.type': accountTypes,
  'account.balanceCorrectionType': balanceCorrectionTypes,
  'account.endDateOffsetInterval': accountOffsetIntervals,
  'account.payoffInterval': accountPayoffIntervals,
  'reminder.interval': reminderIntervals,
  'reminderMarker.state': reminderMarkerStates,
} as const satisfies Record<string, readonly string[]>

type TKnownWirePath = keyof typeof knownWireValues

const openEnum = <TPath extends TKnownWirePath>(_path: TPath) =>
  stringId as unknown as z.ZodType<
    TOpenEnum<(typeof knownWireValues)[TPath][number]>
  >
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

const instrumentWireSchema = z
  .object({
    id: numberId,
    changed: timestamp,
    title: z.string(),
    shortTitle: z.string(),
    symbol: z.string(),
    rate: z.number(),
  })
  .passthrough()

const countryWireSchema = z
  .object({
    id: numberId,
    title: z.string(),
    currency: numberId,
    domain: nullable(z.string()),
  })
  .passthrough()

const companyWireSchema = z
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
  .passthrough()

const userWireSchema = z
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
  .passthrough()

const merchantWireSchema = z
  .object({
    id: stringId,
    changed: timestamp,
    user: numberId,
    title: z.string(),
    mcc: nullable(z.number()).optional(),
  })
  .passthrough()

const accountWireSchema = z
  .object({
    id: stringId,
    changed: timestamp,
    user: numberId,
    instrument: numberId,
    title: z.string(),
    role: nullable(z.number()),
    company: nullable(numberId),
    type: openEnum('account.type'),
    syncID: nullable(stringArray),
    balance: z.number(),
    startBalance: z.number(),
    creditLimit: z.number(),
    inBalance: z.boolean(),
    savings: nullable(z.boolean()),
    enableCorrection: z.boolean(),
    balanceCorrectionType: nullable(openEnum('account.balanceCorrectionType')),
    enableSMS: z.boolean(),
    archive: z.boolean(),
    private: z.boolean(),
    capitalization: nullable(z.boolean()),
    percent: nullable(z.number()),
    startDate: nullable(isoDate),
    endDateOffset: nullable(z.number()),
    endDateOffsetInterval: nullable(openEnum('account.endDateOffsetInterval')),
    payoffStep: nullable(z.number()),
    payoffInterval: nullable(openEnum('account.payoffInterval')),
  })
  .passthrough()

const tagWireSchema = z
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
  .passthrough()

const budgetWireSchema = z
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
  .passthrough()

const reminderWireSchema = z
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
    interval: nullable(openEnum('reminder.interval')),
    step: nullable(z.number()),
    points: nullable(numberArray),
    startDate: isoDate,
    endDate: nullable(isoDate),
    notify: z.boolean(),
  })
  .passthrough()

const reminderMarkerWireSchema = z
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
    state: openEnum('reminderMarker.state'),
    notify: z.boolean(),
    isForecast: z.boolean().optional(),
  })
  .passthrough()

const transactionWireSchema = z
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
    incomeBankID: nullable(z.union([numberId, stringId])),
    incomeInstrument: numberId,
    // Nullable only because deleting an account nulls the leg that pointed at
    // it on a soft-deleted debt operation (round 9). The shape rule — a null
    // leg is legal only on a deleted row — is enforced in `hasValidReferences`,
    // which can see `deleted` alongside it.
    incomeAccount: nullable(stringId),
    income: z.number(),
    outcomeBankID: nullable(z.union([numberId, stringId])),
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
  .passthrough()

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

/**
 * Every entity collection a ZenMoney payload can carry, in dependency order.
 * Individual schemas stay private on purpose: a consumer that needs one of
 * them needs the set.
 * The diff schema, the full-backup schema and the import warnings all read
 * this one record, so a new entity is declared once.
 */
export const wireSchemas = {
  instrument: instrumentWireSchema,
  country: countryWireSchema,
  company: companyWireSchema,
  user: userWireSchema,
  merchant: merchantWireSchema,
  account: accountWireSchema,
  tag: tagWireSchema,
  budget: budgetWireSchema,
  reminder: reminderWireSchema,
  reminderMarker: reminderMarkerWireSchema,
  transaction: transactionWireSchema,
} as const satisfies Record<TDataEntityKey, z.ZodObject<z.ZodRawShape>>

type TCollectionShape<TWrap> = {
  [TKey in TDataEntityKey]: TWrap
}

function collections<TWrap extends z.ZodType>(
  wrap: <TKey extends TDataEntityKey>(
    schema: (typeof wireSchemas)[TKey]
  ) => TWrap
): TCollectionShape<TWrap> {
  return Object.fromEntries(
    Object.entries(wireSchemas).map(([key, schema]) => [
      key,
      wrap(schema as (typeof wireSchemas)[TDataEntityKey]),
    ])
  ) as TCollectionShape<TWrap>
}

/** A partial server response or request diff. */
export const zenMoneyDiffWireSchema = z
  .object({
    serverTimestamp: timestamp,
    deletion: z.array(deletionWireSchema).optional(),
    ...collections(schema => z.array(schema).optional()),
  })
  .strict()

/** A complete exported snapshot: every collection present, no deletions. */
export const fullBackupCollectionsShape = collections(schema => z.array(schema))

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
