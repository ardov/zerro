import { RootState } from 'store'

export const getTagBudgets = (state: RootState) => state.data.current.budget
