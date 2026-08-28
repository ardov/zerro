import { useBreakpointDown } from '6-shared/hooks/useBreakpointDown'
import { cn } from '6-shared/ui/shadcn/utils'
import type { FC, HTMLAttributes, ReactNode } from 'react'
import { Metric, useColumns } from '../models/useMetric'

export function useIsSmall() {
  return useBreakpointDown('sm')
}

const rowClassName =
  'grid w-full grid-cols-[minmax(0,1fr)_90px_16px] items-center gap-x-3 px-4 sm:grid-cols-[minmax(0,1fr)_90px_90px_90px_16px]'

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
    <div className={cn(rowClassName, className)} {...rest}>
      {name}
      {columns.includes(Metric.assigned) && assigned}
      {columns.includes(Metric.outcome) && outcome}
      {columns.includes(Metric.available) && available}
      {goal}
    </div>
  )
}
