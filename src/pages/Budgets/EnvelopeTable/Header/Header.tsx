import React, { FC } from 'react'
import { Typography, Box, Menu, MenuItem, Button } from '@mui/material'
import { GoalsProgress } from '@features/bulkActions/fillGoals'
import { rowStyle, useIsSmall } from '../shared/shared'
import { MonthSelect } from './MonthSelect'
import { ToBeBudgeted } from './ToBeBudgeted'
import { Metric } from '../models/useMetric'
import { usePopover } from '@shared/hooks/useEnvelopePopover'
import { ChevronDownIcon } from '@shared/ui/Icons'
import { TISOMonth } from '@shared/types'

type HeaderProps = {
  month: TISOMonth
  metric: Metric
  isAllShown: boolean
  isReordering: boolean
  onShowAllToggle: () => void
  onReorderModeToggle: () => void
  onOpenOverview: () => void
  onMetricSwitch: () => void
}

export const Header: FC<HeaderProps> = props => {
  const {
    month,
    metric,
    isAllShown,
    isReordering,
    onShowAllToggle,
    onReorderModeToggle,
    onOpenOverview,
    onMetricSwitch,
  } = props
  const isSmall = useIsSmall()
  const tableMenu = usePopover()
  return (
    <>
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
            {!isSmall && <GoalsProgress month={month} />}
            <ToBeBudgeted onClick={onOpenOverview} />
          </Box>
        </Box>

        <Box sx={rowStyle}>
          <div>
            <Button
              size="small"
              onClick={tableMenu.onOpen}
              sx={{ ml: -1, px: 1, py: 0 }}
            >
              <Typography variant="overline" color="text.secondary" noWrap>
                Категории{isAllShown && ' (все)'}
              </Typography>
              <ChevronDownIcon />
            </Button>
          </div>

          {(metric === Metric.budgeted || !isSmall) && (
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

          {(metric === Metric.outcome || !isSmall) && (
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

          {(metric === Metric.available || !isSmall) && (
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

      <Menu {...tableMenu.popoverProps}>
        <MenuItem
          onClick={() => {
            tableMenu.onClose()
            onShowAllToggle()
          }}
        >
          {isAllShown ? 'Скрыть часть категорий' : 'Показать все категории'}
        </MenuItem>
        <MenuItem
          onClick={() => {
            tableMenu.onClose()
            onReorderModeToggle()
          }}
        >
          {isReordering ? 'Скрыть таскалки' : 'Изменить порядок категорий'}
        </MenuItem>
      </Menu>
    </>
  )
}
