import React, { FC } from 'react'
import { Typography, Box, useMediaQuery, Theme } from '@mui/material'
import { useMonth } from '@pages/Budgets/model'
import { GoalsProgress } from '@features/bulkActions/fillGoals'
import { Metric, rowStyle } from '../shared/shared'
import { MonthSelect } from './MonthSelect'
import { ToBeBudgeted } from './ToBeBudgeted'

type HeaderProps = {
  metric: Metric
  onOpenOverview: () => void
  onMetricSwitch: () => void
}

export const Header: FC<HeaderProps> = props => {
  const [month] = useMonth()
  const { metric, onMetricSwitch, onOpenOverview } = props
  const isMobile = useMediaQuery<Theme>(theme => theme.breakpoints.down('sm'))
  return (
    <Box
      sx={{
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        position: 'sticky',
        top: 0,
        borderBottom: `1px solid black`,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        zIndex: 99,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          p: 1,
          gap: 2,
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          position: 'sticky',
          top: 0,
          zIndex: 9,
        }}
      >
        <MonthSelect />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <GoalsProgress month={month} />
          <ToBeBudgeted onClick={onOpenOverview} />
        </Box>
      </Box>

      <Box sx={rowStyle}>
        <Typography variant="overline" color="text.secondary" noWrap>
          Конверты
        </Typography>

        {(metric === Metric.budgeted || !isMobile) && (
          <Typography
            variant="overline"
            color="text.secondary"
            align="right"
            onClick={onMetricSwitch}
            noWrap
          >
            Бюджет
          </Typography>
        )}

        {(metric === Metric.outcome || !isMobile) && (
          <Typography
            variant="overline"
            color="text.secondary"
            align="right"
            onClick={onMetricSwitch}
            noWrap
          >
            Операции
          </Typography>
        )}

        {(metric === Metric.available || !isMobile) && (
          <Typography
            variant="overline"
            color="text.secondary"
            align="right"
            onClick={onMetricSwitch}
            noWrap
          >
            Доступно
          </Typography>
        )}
      </Box>
    </Box>
  )
}
