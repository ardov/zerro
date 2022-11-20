import { RootState } from '@store'
import { TDateDraft } from '@shared/types'
import { getBudgetId } from './getBudgetId'
import { TTagId } from '@shared/types'

export const getBudgets = (state: RootState) => state.data.current.budget

export const getBudget = (state: RootState, tag: TTagId, month: TDateDraft) =>
  getBudgets(state)[getBudgetId(month, tag)]
