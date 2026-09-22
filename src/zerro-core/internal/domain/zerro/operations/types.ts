import { z } from 'zod'
import { isISOMonth } from '../../foundation/date'
import type { TISOMonth } from '../../zenmoney/primitives'
import type { TEnvelopeId } from '../envelope-id'

const month = z.custom<TISOMonth>(isISOMonth)
const envelopeId = z.custom<TEnvelopeId>(
  value =>
    typeof value === 'string' && /^(tag|account|merchant|payee)#.+$/.test(value)
)
const amount = z.number().finite()
const meta = z.object({
  group: z.string(),
  index: amount,
  visibility: z.enum(['auto', 'hidden', 'visible']),
  parent: envelopeId,
  comment: z.string(),
  currency: z.string(),
  keepIncome: z.boolean(),
  carryNegatives: z.boolean(),
})
const settings = z.object({
  emojiIcons: z.boolean(),
  preferZmBudgets: z.boolean(),
  sawMigrationAlert: z.boolean(),
})
const goal = z.discriminatedUnion('type', [
  z.object({ type: z.literal('monthly'), amount }).strict(),
  z.object({ type: z.literal('monthlySpend'), amount }).strict(),
  z.object({ type: z.literal('incomePercent'), amount }).strict(),
  z
    .object({
      type: z.literal('targetBalance'),
      amount,
      end: z.iso.date().optional(),
    })
    .strict(),
])
export const zerroIntentSchema = z.discriminatedUnion('type', [
  z
    .object({
      type: z.literal('budgets.set'),
      month,
      values: z.array(z.object({ envelopeId, amount }).strict()),
      nativeTags: z.boolean(),
    })
    .strict(),
  z.object({ type: z.literal('goals.set'), month, envelopeId, goal }).strict(),
  z.object({ type: z.literal('goals.stop'), month, envelopeId }).strict(),
  z
    .object({ type: z.literal('goals.clearOverride'), month, envelopeId })
    .strict(),
  z
    .object({
      type: z.literal('envelopes.patchMeta'),
      envelopeId,
      set: meta.partial().strict().optional(),
      unset: z.array(meta.keyof()).optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal('settings.patch'),
      set: settings.partial().strict().optional(),
      unset: z.array(settings.keyof()).optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal('fxRates.patch'),
      month,
      set: z.record(z.string().min(1), amount.positive()).optional(),
      unset: z.array(z.string().min(1)).optional(),
    })
    .strict(),
  z.object({ type: z.literal('fxRates.reset'), month }).strict(),
])
export type TZerroIntent = z.infer<typeof zerroIntentSchema>
export type TZerroInput<T extends TZerroIntent['type']> = Omit<
  Extract<TZerroIntent, { type: T }>,
  'type' | 'nativeTags'
>
const storageSchema = z
  .object({ accountId: z.string().min(1), reminderId: z.string().min(1) })
  .strict()
export type TZerroOperation = TZerroIntent & {
  storage: z.infer<typeof storageSchema>
}
export function parseZerroOperation(value: unknown): TZerroOperation {
  if (!value || typeof value !== 'object')
    throw new Error('Invalid Zerro operation')
  const { storage, ...intent } = value as Record<string, unknown>
  const parsed = zerroIntentSchema.parse(intent)
  if (
    'set' in parsed &&
    parsed.unset?.some(key => Object.hasOwn(parsed.set ?? {}, key))
  )
    throw new Error('Cannot set and unset the same field')
  return { ...parsed, storage: storageSchema.parse(storage) }
}
