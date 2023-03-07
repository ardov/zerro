import { Theme, useMediaQuery } from '@mui/material'
import { Box, BoxProps, SxProps } from '@mui/system'
import { FC, ReactNode } from 'react'
import { Metric, useColumns } from '../models/useMetric'

export function useIsSmall() {
  return useMediaQuery<Theme>(theme => theme.breakpoints.down('sm'))
}

const rowStyle: SxProps = {
  display: 'grid',
  gridTemplateColumns: {
    xs: 'auto 90px 16px',
    sm: 'auto 90px 90px 90px 16px',
  },
  width: '100%',
  px: 2,
  alignItems: 'center',
  justifyContent: 'initial',
  gridColumnGap: '12px',
}

export const TableRow: FC<
  BoxProps & {
    name: ReactNode
    available: ReactNode
    budgeted: ReactNode
    outcome: ReactNode
    goal: ReactNode
  }
> = props => {
  const { name, available, budgeted, outcome, goal, sx, ...rest } = props
  const { columns } = useColumns()
  return (
    <Box sx={sx ? { ...rowStyle, ...sx } : rowStyle} {...rest}>
      {name}
      {columns.includes(Metric.budgeted) && budgeted}
      {columns.includes(Metric.outcome) && outcome}
      {columns.includes(Metric.available) && available}
      {goal}
    </Box>
  )
}
