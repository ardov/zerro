import { isISOMonth } from '../../shared/date'
import type { TDataStore } from '../../zenmoney/store'
import type { TISOMonth } from '../../zenmoney/primitives'
import type { TCoreContext, TNormalizedPatch } from '../../../types'
import {
  compileDeleteReminder,
  compileSetReminder,
  type TReminder,
} from '../../zenmoney'
import { compileEnsureZerroDataAccount } from '../accounts'
import {
  getMonthlyHiddenDataReminders,
  getSimpleHiddenDataReminder,
} from './read'
import { HiddenDataType, type THiddenDataComment } from './types'

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
): TNormalizedPatch {
  const {
    patch: accountPatch,
    receipt: { accountId },
  } = compileEnsureZerroDataAccount(data, ctx)
  const reminder = getSimpleHiddenDataReminder(data, type)
  const reminderPatch = compileSetHiddenDataReminder(
    data,
    {
      id: reminder?.id,
      accountId,
      comment: stringifyHiddenDataComment({ type, payload }),
    },
    ctx
  )

  return mergeNormalizedPatches(accountPatch, reminderPatch)
}

export function compileResetSimpleHiddenData(
  data: TDataStore,
  type: HiddenDataType,
  ctx: Pick<TCoreContext, 'now'>
): TNormalizedPatch {
  const reminder = getSimpleHiddenDataReminder(data, type)
  if (!reminder) return {}
  return compileDeleteReminder(data, reminder.id, ctx)
}

export function compileSetMonthlyHiddenData<TPayload>(
  data: TDataStore,
  type: HiddenDataType,
  payload: TPayload,
  month: TISOMonth,
  ctx: TCoreContext
): TNormalizedPatch {
  if (!isISOMonth(month)) throw new Error('Invalid month')
  if (isHiddenDataPayloadEmpty(payload)) {
    return compileResetMonthlyHiddenData(data, type, month, ctx)
  }

  const {
    patch: accountPatch,
    receipt: { accountId },
  } = compileEnsureZerroDataAccount(data, ctx)
  const reminder = getMonthlyHiddenDataReminders(data, type)[month]
  const reminderPatch = compileSetHiddenDataReminder(
    data,
    {
      id: reminder?.id,
      accountId,
      comment: stringifyHiddenDataComment({ type, month, payload }),
    },
    ctx
  )

  return mergeNormalizedPatches(accountPatch, reminderPatch)
}

export function compileResetMonthlyHiddenData(
  data: TDataStore,
  type: HiddenDataType,
  month: TISOMonth,
  ctx: Pick<TCoreContext, 'now'>
): TNormalizedPatch {
  if (!isISOMonth(month)) throw new Error('Invalid month')

  const reminder = getMonthlyHiddenDataReminders(data, type)[month]
  if (!reminder) return {}
  return compileDeleteReminder(data, reminder.id, ctx)
}

function compileSetHiddenDataReminder(
  data: TDataStore,
  input: {
    id?: TReminder['id']
    accountId: TReminder['incomeAccount']
    comment: string
  },
  ctx: TCoreContext
): TNormalizedPatch {
  return compileSetReminder(
    data,
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

export function mergeNormalizedPatches(
  ...patches: TNormalizedPatch[]
): TNormalizedPatch {
  const result: TNormalizedPatch = {}

  patches.forEach(patch => {
    Object.entries(patch).forEach(([key, value]) => {
      if (!Array.isArray(value)) return
      const patchKey = key as keyof TNormalizedPatch
      const current = result[patchKey]
      result[patchKey] = [
        ...(Array.isArray(current) ? current : []),
        ...value,
      ] as never
    })
  })

  return result
}
