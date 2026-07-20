import type { FC } from 'react'
import { Typography, Box, Button } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { ChevronDownIcon } from '6-shared/ui/Icons'
import type { TISOMonth } from '6-shared/types'

import { GoalsProgress } from '4-features/bulkActions/fillGoals'
import { TableRow, useIsSmall } from '../shared/shared'
import { MonthSelect } from './MonthSelect'
import { ToBeBudgeted } from './ToBeBudgeted'
import { useColumns } from '../models/useMetric'
import { useTableMenu, TableMenu } from './TableMenu'

type HeaderProps = {
  month: TISOMonth
  isAllShown: boolean
  isReordering: boolean
  onShowAllToggle: () => void
  onReorderModeToggle: () => void
  onOpenOverview: () => void
}

const ColumnTitle: FC<{ name: string; onClick?: () => void }> = props => (
  <Typography
    variant="overline"
    align="right"
    onClick={props.onClick}
    noWrap
    sx={{
      color: 'text.secondary',
    }}
  >
    {props.name}
  </Typography>
)

export const Header: FC<HeaderProps> = props => {
  const {
    month,
    isAllShown,
    isReordering,
    onShowAllToggle,
    onReorderModeToggle,
    onOpenOverview,
  } = props
  const { t } = useTranslation('common')
  const isSmall = useIsSmall()
  const openOnClick = useTableMenu({
    isAllShown,
    isReordering,
    onShowAllToggle,
    onReorderModeToggle,
  })

  const { nextColumn } = useColumns()

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

        <TableRow
          name={
            <div>
              <Button
                size="small"
                onClick={openOnClick}
                sx={{ ml: -1, px: 1, py: 0 }}
              >
                <Typography
                  variant="overline"
                  noWrap
                  sx={{
                    color: 'text.secondary',
                  }}
                >
                  {t('categories', {
                    ns: 'budgets',
                    context: isAllShown ? 'all' : '',
                  })}
                </Typography>
                <ChevronDownIcon />
              </Button>
            </div>
          }
          budgeted={<ColumnTitle name={t('budget')} onClick={nextColumn} />}
          outcome={<ColumnTitle name={t('activity')} onClick={nextColumn} />}
          available={<ColumnTitle name={t('available')} onClick={nextColumn} />}
          goal={null}
        />
      </Box>
      <TableMenu />
    </>
  )
}
