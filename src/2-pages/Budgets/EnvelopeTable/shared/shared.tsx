import type { Theme } from '@mui/material'
import { useMediaQuery } from '@mui/material'
import clsx from 'clsx'
import type { FC, HTMLAttributes, ReactNode } from 'react'
import { Metric, useColumns } from '../models/useMetric'

export function useIsSmall() {
  return useMediaQuery<Theme>(theme => theme.breakpoints.down('sm'))
}

const rowClassName =
  'grid w-full grid-cols-[auto_90px_16px] items-center justify-start gap-x-3 px-4 sm:grid-cols-[auto_90px_90px_90px_16px]'

export const TableRow: FC<
  HTMLAttributes<HTMLDivElement> & {
    name: ReactNode
    available: ReactNode
    assigned: ReactNode
    outcome: ReactNode
    goal: ReactNode
  }
> = props => {
  const { name, available, assigned, outcome, goal, className, ...rest } = props
  const { columns } = useColumns()
  return (
    <div className={clsx(rowClassName, className)} {...rest}>
      {name}
      {columns.includes(Metric.assigned) && assigned}
      {columns.includes(Metric.outcome) && outcome}
      {columns.includes(Metric.available) && available}
      {goal}
    </div>
  )
}
