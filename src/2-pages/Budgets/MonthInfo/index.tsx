import type { FC, HTMLAttributes } from 'react'
import clsx from 'clsx'
import { useAppDispatch, useAppSelector } from 'store'
import { isZero } from '6-shared/helpers/money'
import { formatDate } from '6-shared/helpers/date'
import { startFresh } from '4-features/bulkActions/startFresh'
import type { Theme } from '@mui/material'
import { Button, IconButton, useMediaQuery } from '@mui/material'
import { CloseIcon } from '6-shared/ui/Icons'
import { Tooltip } from '6-shared/ui/Tooltip'
import type { TDateDraft, TISOMonth } from '6-shared/types'

import { DisplayAmount } from '3-widgets/DisplayAmount'
import {
  fixOverspends as fixAllOverspends,
  OverspendNotice,
} from '4-features/bulkActions/fixOverspend'
import { copyPreviousBudget } from '4-features/bulkActions/copyPrevMonth'
import { useMonth } from '../MonthProvider'
import { BalanceWidget } from '../BalanceWidget'
import { FxRates } from './FxRates'
import { ActivityStats } from './ActivityStats'
import { core } from 'zerro-core/redux'

import { fillGoals } from '4-features/bulkActions/fillGoals'
import { useConfirm } from '6-shared/ui/SmartConfirm'
import { useTranslation } from 'react-i18next'

type MonthInfoProps = HTMLAttributes<HTMLDivElement> & { onClose: () => void }

export const MonthInfo: FC<MonthInfoProps> = ({
  onClose,
  className,
  ...rest
}) => {
  const { t } = useTranslation('budgets', { keyPrefix: 'actions' })
  const [month] = useMonth()
  const isMobile = useMediaQuery<Theme>(theme => theme.breakpoints.down('md'))
  const { overspend } = useAppSelector(core.months.selectTotals)[month]

  const dispatch = useAppDispatch()

  const copyAllBudgets = useConfirm({
    onOk: () => dispatch(copyPreviousBudget(month)),
    title: t('copyAllBudgets.title'),
    description: t('copyAllBudgets.description'),
    okText: t('copyAllBudgets.okText'),
    cancelText: t('copyAllBudgets.cancelText'),
  })

  const fixOverspends = useConfirm({
    onOk: () => dispatch(fixAllOverspends(month)),
    title: t('fixOverspends.title'),
    okText: t('fixOverspends.okText'),
    cancelText: t('fixOverspends.cancelText'),
  })

  const startAgain = useConfirm({
    onOk: () => dispatch(startFresh(month)),
    title: t('startAgain.title'),
    description: t('startAgain.description'),
    okText: t('startAgain.okText'),
    cancelText: t('startAgain.cancelText'),
  })

  return (
    <div {...rest} className={clsx('min-h-screen', className)}>
      {isMobile && (
        <div className="flex items-center px-6 py-2">
          <div className="grow">
            <h2 className="truncate text-xl font-medium leading-8">
              {getMonthName(month)}
            </h2>
          </div>

          <Tooltip title={t('close')}>
            <IconButton edge="end" onClick={onClose} children={<CloseIcon />} />
          </Tooltip>
        </div>
      )}
      <div className="flex flex-col gap-4 p-6">
        <OverspendNotice month={month} />

        <BalanceWidget month={month} />
        <ActivityStats month={month} />
        <FxRates month={month} />

        <div className="rounded-lg bg-background p-4">
          <div className="mb-2">
            <p className="text-center text-base leading-6">{t('actions')}</p>
          </div>

          <Button fullWidth color="secondary" onClick={copyAllBudgets}>
            {t('copyAllBudgets.trigger')}
          </Button>

          {!isZero(overspend) && (
            <Button fullWidth color="secondary" onClick={fixOverspends}>
              <span>
                {t('fixOverspends.trigger')} (
                <DisplayAmount value={overspend} month={month} />)
              </span>
            </Button>
          )}

          <GoalAction month={month} />

          <Button fullWidth color="secondary" onClick={startAgain}>
            {t('startAgain.trigger')}
          </Button>
        </div>
      </div>
    </div>
  )
}

const getMonthName = (date: TDateDraft) =>
  formatDate(new Date(date), 'LLLL').toUpperCase()

function GoalAction(props: { month: TISOMonth }) {
  const { t } = useTranslation('budgets', {
    keyPrefix: 'actions.completeAllGoals',
  })
  const dispatch = useAppDispatch()
  const { month } = props
  const { progress, goalsCount } = useAppSelector(core.goals.selectTotals)[
    month
  ]
  const canComplete = progress < 1 && goalsCount > 0

  const completeAll = useConfirm({
    onOk: () => dispatch(fillGoals(month)),
    title: t('title'),
    description: t('description'),
    okText: t('okText'),
    cancelText: t('cancelText'),
  })

  if (!canComplete) return null

  return (
    <Button fullWidth color="secondary" onClick={completeAll}>
      {t('trigger')}
    </Button>
  )
}
