interface GoalsProgress {
  progress: number
  need: number
  target: number
}

export function getGoalProgress(
  state: any,
  month: number,
  id: string
): GoalsProgress

export function getGoalsProgress(
  state: any
): {
  [month: number]: {
    [tagId: string]: GoalsProgress
  }
}
