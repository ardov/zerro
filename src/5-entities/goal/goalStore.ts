import { TEnvelopeId } from '5-entities/envelope'
import {
  HiddenDataType,
  makeMonthlyHiddenStore,
} from '5-entities/shared/hidden-store'
import { TGoal } from './shared/types'

export type TGoals = Record<TEnvelopeId, TGoal | null>

export const goalStore = makeMonthlyHiddenStore<TGoals>(HiddenDataType.Goals)

export const getRawGoals = goalStore.getData
