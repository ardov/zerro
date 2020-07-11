export interface Account {
  user: number
  instrument: number
  title: string

  id: string
  changed: number
  role: number | null
  company: number | null
  type: 'cash' | 'ccard' | 'checking' | 'loan' | 'deposit' | 'emoney' | 'debt'
  syncID: string[] | null

  balance: number
  startBalance: number
  creditLimit: number

  inBalance: boolean
  savings: boolean
  enableCorrection: boolean
  enableSMS: boolean
  archive: boolean
  private: boolean

  // Для счетов с типом отличных от 'loan' и 'deposit' в  этих полях можно ставить null
  capitalization?: boolean | null
  percent?: number | null
  startDate?: number | null
  endDateOffset?: number | null
  endDateOffsetInterval?: 'day' | 'week' | 'month' | 'year' | null
  payoffStep?: number | null
  payoffInterval?: 'month' | 'year' | null
}

export type GoalType = 'monthly' | 'monthlySpend' | 'targetBalance'
export interface Goal {
  type: GoalType
  amount: number
  end?: string
}
export interface LocalGoal {
  type: GoalType
  amount: number
  end?: number
}
