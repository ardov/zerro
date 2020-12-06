import { RootState } from 'store'

interface GoalsProgress {
  progress: number
  need: number
  target: number
}

export function getGoalProgress(
  state: RootState,
  month: number,
  id: string
): GoalsProgress

export function getGoalsProgress(
  state: RootState
): {
  [month: number]: {
    [tagId: string]: GoalsProgress
  }
}

export function getTotalGoalsProgress(
  state: RootState
): { [month: number]: GoalsProgress | null }
