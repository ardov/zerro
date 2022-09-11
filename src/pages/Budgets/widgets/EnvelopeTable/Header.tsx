import React, { FC } from 'react'
import { Typography, Box, useMediaQuery, Theme } from '@mui/material'
import { Metric, rowStyle } from './shared/shared'

type HeaderProps = {
  metric: Metric
  onMetricSwitch: () => void
}

export const Header: FC<HeaderProps> = props => {
  const { metric, onMetricSwitch } = props
  const isMobile = useMediaQuery<Theme>(theme => theme.breakpoints.down('sm'))
  return (
    <Box
      sx={{
        ...rowStyle,
        borderBottom: `1px solid black`,
        borderColor: 'divider',
      }}
    >
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
  )
}
