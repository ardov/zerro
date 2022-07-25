import { HiddenDataType, makeMonthlyHiddenStore } from 'models/hidden-store'
import { TEnvelopeId } from 'models/shared/envelopeHelpers'
import { TGoal } from './types'

export type TGoals = Record<TEnvelopeId, TGoal | null>

export const goalStore = makeMonthlyHiddenStore<TGoals>(HiddenDataType.Goals)

export const getGoals = goalStore.getData
