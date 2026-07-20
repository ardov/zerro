import { isISOMonth } from '../../foundation/date'
import { intentEntityKeys, type TDataStore } from '../../zenmoney/model/store'
import type { TISOMonth } from '../../zenmoney/primitives'
import type { TCoreContext, TIntentPatch } from '../../../../types'
import {
  compileDeleteReminder,
  compileSetReminder,
  type TReminder,
} from '../../zenmoney/entities/reminders'
import { compileEnsureZerroDataAccount } from '../accounts'
import {
  getMonthlyHiddenDataReminders,
  getSimpleHiddenDataReminder,
} from './read'
import type { HiddenDataType } from './types'
import { type THiddenDataComment } from './types'

export function stringifyHiddenDataComment<TPayload>(
  comment: THiddenDataComment<TPayload>
): string {
  return JSON.stringify(comment)
}

export function compileSetSimpleHiddenData<TPayload>(
  data: TDataStore,
  type: HiddenDataType,
  payload: TPayload,
  ctx: TCoreContext
): TIntentPatch {
  const {
    patch: accountPatch,
    receipt: { accountId },
  } = compileEnsureZerroDataAccount(data, ctx)
  const reminder = getSimpleHiddenDataReminder(data.reminder, type)
  const reminderPatch = compileSetHiddenDataReminder(
    data,
    {
      id: reminder?.id,
      accountId,
      comment: stringifyHiddenDataComment({ type, payload }),
    },
    ctx
  )

  return mergePatches(accountPatch, reminderPatch)
}

export function compileSetMonthlyHiddenData<TPayload>(
  data: TDataStore,
  type: HiddenDataType,
  payload: TPayload,
  month: TISOMonth,
  ctx: TCoreContext
): TIntentPatch {
  if (!isISOMonth(month)) throw new Error('Invalid month')
  if (isHiddenDataPayloadEmpty(payload)) {
    return compileResetMonthlyHiddenData(data, type, month)
  }

  const {
    patch: accountPatch,
    receipt: { accountId },
  } = compileEnsureZerroDataAccount(data, ctx)
  const reminder = getMonthlyHiddenDataReminders(data.reminder, type)[month]
  const reminderPatch = compileSetHiddenDataReminder(
    data,
    {
      id: reminder?.id,
      accountId,
      comment: stringifyHiddenDataComment({ type, month, payload }),
    },
    ctx
  )

  return mergePatches(accountPatch, reminderPatch)
}

export function compileResetMonthlyHiddenData(
  data: TDataStore,
  type: HiddenDataType,
  month: TISOMonth
): TIntentPatch {
  if (!isISOMonth(month)) throw new Error('Invalid month')

  const reminder = getMonthlyHiddenDataReminders(data.reminder, type)[month]
  if (!reminder) return {}
  return compileDeleteReminder(data.reminder, reminder.id)
}

function compileSetHiddenDataReminder(
  data: TDataStore,
  input: {
    id?: TReminder['id']
    accountId: TReminder['incomeAccount']
    comment: string
  },
  ctx: TCoreContext
): TIntentPatch {
  return compileSetReminder(
    { reminders: data.reminder, users: data.user },
    {
      id: input.id,
      incomeAccount: input.accountId,
      outcomeAccount: input.accountId,
      income: 1,
      startDate: '2020-01-01',
      endDate: '2020-01-01',
      comment: input.comment,
    },
    ctx
  )
}

function isHiddenDataPayloadEmpty(payload: unknown): boolean {
  if (!payload) return true
  if (Array.isArray(payload)) return payload.length === 0
  if (typeof payload === 'object') return Object.keys(payload).length === 0
  return false
}

/**
 * Best-effort application of a sparse intent patch onto a snapshot for chained
 * compilation: sparse entities merge over current so later reads in the same
 * compile see earlier writes. Not a substitute for real materialization.
 */
export function applyIntentPatch(
  base: TDataStore,
  patch: TIntentPatch
): TDataStore {
  const next: TDataStore = { ...base }

  intentEntityKeys.forEach(key => {
    const intents = patch[key]
    if (!intents?.length) return
    const map = { ...next[key] } as Record<string | number, object>
    intents.forEach(intent => {
      map[intent.id] = { ...map[intent.id], ...intent }
    })
    // @ts-expect-error Dynamic ZenMoney entity access.
    next[key] = map
  })

  patch.deletion?.forEach(({ id, object }) => {
    const entities =
      next[object as Exclude<keyof TDataStore, 'serverTimestamp'>]
    const map = { ...entities } as Record<string | number, object>
    delete map[id]
    // @ts-expect-error Dynamic ZenMoney entity access.
    next[object] = map
  })

  return next
}

export function mergePatches(...patches: TIntentPatch[]): TIntentPatch {
  const result: TIntentPatch = {}

  patches.forEach(patch => {
    Object.entries(patch).forEach(([key, value]) => {
      if (!Array.isArray(value)) return
      const patchKey = key as keyof TIntentPatch
      const current = result[patchKey]
      result[patchKey] = [
        ...(Array.isArray(current) ? current : []),
        ...value,
      ] as never
    })
  })

  return result
}
