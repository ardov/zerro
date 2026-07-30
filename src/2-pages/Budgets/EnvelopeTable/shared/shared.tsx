import type { Theme } from '@mui/material'
import { useMediaQuery } from '@mui/material'
import type { BoxProps, SxProps } from '@mui/system'
import { Box } from '@mui/system'
import type { FC, ReactNode } from 'react'
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
    assigned: ReactNode
    outcome: ReactNode
    goal: ReactNode
  }
> = props => {
  const { name, available, assigned, outcome, goal, sx, ...rest } = props
  const { columns } = useColumns()
  return (
    <Box sx={sx ? { ...rowStyle, ...sx } : rowStyle} {...rest}>
      {name}
      {columns.includes(Metric.assigned) && assigned}
      {columns.includes(Metric.outcome) && outcome}
      {columns.includes(Metric.available) && available}
      {goal}
    </Box>
  )
}
