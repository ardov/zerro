import {
  HiddenDataType,
  makeMonthlyHiddenStore,
} from '@entities/shared/hidden-store'
import { TEnvelopeId } from '@shared/types'
import { TGoal } from './shared/types'

export type TGoals = Record<TEnvelopeId, TGoal | null>

export const goalStore = makeMonthlyHiddenStore<TGoals>(HiddenDataType.Goals)

export const getRawGoals = goalStore.getData
