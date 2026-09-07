import { Button } from '@/6-shared/ui/Button'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDownIcon } from '@/6-shared/ui/Icons'
import type { TISOMonth } from '@/6-shared/types'

import { GoalsProgress } from '@/4-features/bulkActions/fillGoals'
import { TableRow, useIsSmall } from '../shared/shared'
import { MonthSelect } from './MonthSelect'
import { ToBeAssigned } from './ToBeAssigned'
import { useColumns } from '../models/useMetric'
import type { TableMenuChoice } from './TableMenu'
import { TableMenu } from './TableMenu'
import { useAsk } from '@/6-shared/overlays'

type HeaderProps = {
  month: TISOMonth
  isAllShown: boolean
  isReordering: boolean
  onShowAllToggle: () => void
  onReorderModeToggle: () => void
  onOpenOverview: () => void
}

const ColumnTitle: FC<{ name: string; onClick?: () => void }> = props => (
  <span
    onClick={props.onClick}
    className="truncate text-right text-overline uppercase text-muted-foreground"
  >
    {props.name}
  </span>
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
  const ask = useAsk()
  const openOnClick = async (e: React.MouseEvent) => {
    const choice = await ask<TableMenuChoice>(
      <TableMenu
        isAllShown={isAllShown}
        isReordering={isReordering}
        anchorEl={e.currentTarget}
      />
    )
    if (choice === 'showAllToggle') onShowAllToggle()
    if (choice === 'reorderModeToggle') onReorderModeToggle()
  }

  const { nextColumn } = useColumns()

  return (
    <>
      <div className="sticky top-0 z-[99] rounded-t-lg border-b border-border bg-card">
        <div className="sticky top-0 z-[9] flex flex-wrap justify-between gap-4 p-2">
          <MonthSelect />

          <div className="flex gap-4">
            {!isSmall && <GoalsProgress month={month} />}
            <ToBeAssigned onClick={onOpenOverview} />
          </div>
        </div>

        <TableRow
          name={
            <div>
              <Button
                size="small"
                onClick={openOnClick}
                className="-ml-2 px-2 py-0"
              >
                <span className="truncate text-overline uppercase text-muted-foreground">
                  {t('categories', {
                    ns: 'budgets',
                    context: isAllShown ? 'all' : '',
                  })}
                </span>
                <ChevronDownIcon />
              </Button>
            </div>
          }
          assigned={<ColumnTitle name={t('assigned')} onClick={nextColumn} />}
          outcome={<ColumnTitle name={t('activity')} onClick={nextColumn} />}
          available={<ColumnTitle name={t('available')} onClick={nextColumn} />}
          goal={null}
        />
      </div>
    </>
  )
}
