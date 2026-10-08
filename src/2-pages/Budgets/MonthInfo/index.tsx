import { Button } from '@/6-shared/ui/kit/Button'
import type { FC, HTMLAttributes } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import { isZero } from '@/6-shared/helpers/money'
import { startFresh } from '@/4-features/bulkActions/startFresh'
import type { TISOMonth } from '@/6-shared/types'

import { DisplayAmount } from '@/3-widgets/DisplayAmount'
import {
  fixOverspends as fixAllOverspends,
  OverspendNotice,
} from '@/4-features/bulkActions/fixOverspend'
import { copyPreviousBudget } from '@/4-features/bulkActions/copyPrevMonth'
import { useMonth } from '../MonthProvider'
import { BalanceWidget } from '../BalanceWidget'
import { FxRates } from './FxRates'
import { ActivityStats } from './ActivityStats'
import { core } from '@/zerro-core/redux'

import { fillGoals } from '@/4-features/bulkActions/fillGoals'
import { useAsk } from '@/6-shared/overlays'
import { Confirm } from '@/6-shared/ui/kit/Confirm'
import { useTranslation } from 'react-i18next'

/** The month's overview. It has no header of its own: docked beside the table
 * it is part of the page, and the drawer that shows it modally supplies one. */
export const MonthInfo: FC<HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...rest
}) => {
  const { t } = useTranslation('budgets', { keyPrefix: 'actions' })
  const [month] = useMonth()
  const { overspend } = useAppSelector(core.months.selectTotals)[month]

  const dispatch = useAppDispatch()

  const ask = useAsk()

  const copyAllBudgets = async () => {
    const confirmed = await ask(
      <Confirm
        title={t('copyAllBudgets.title')}
        description={t('copyAllBudgets.description')}
        okText={t('copyAllBudgets.okText')}
        cancelText={t('copyAllBudgets.cancelText')}
      />
    )
    if (!confirmed) return
    dispatch(copyPreviousBudget(month))
  }

  const fixOverspends = async () => {
    const confirmed = await ask(
      <Confirm
        title={t('fixOverspends.title')}
        okText={t('fixOverspends.okText')}
        cancelText={t('fixOverspends.cancelText')}
      />
    )
    if (!confirmed) return
    dispatch(fixAllOverspends(month))
  }

  const startAgain = async () => {
    const confirmed = await ask(
      <Confirm
        title={t('startAgain.title')}
        description={t('startAgain.description')}
        okText={t('startAgain.okText')}
        cancelText={t('startAgain.cancelText')}
      />
    )
    if (!confirmed) return
    dispatch(startFresh(month))
  }

  return (
    <div {...rest} className={className}>
      <div className="flex flex-col gap-4 p-6">
        <OverspendNotice month={month} />

        <BalanceWidget month={month} />
        <ActivityStats month={month} />
        <FxRates month={month} />

        <div className="rounded-lg bg-ui-base p-4">
          <div className="mb-2">
            <p className="m-0 text-center text-body">{t('actions')}</p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-auto min-h-10 w-full whitespace-normal py-2"
            onClick={copyAllBudgets}
          >
            {t('copyAllBudgets.trigger')}
          </Button>

          {!isZero(overspend) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto min-h-10 w-full whitespace-normal py-2"
              onClick={fixOverspends}
            >
              <span>
                {t('fixOverspends.trigger')} (
                <DisplayAmount value={overspend} month={month} />)
              </span>
            </Button>
          )}

          <GoalAction month={month} />

          <Button
            variant="ghost"
            size="sm"
            className="h-auto min-h-10 w-full whitespace-normal py-2"
            onClick={startAgain}
          >
            {t('startAgain.trigger')}
          </Button>
        </div>
      </div>
    </div>
  )
}

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

  const ask = useAsk()
  const completeAll = async () => {
    const confirmed = await ask(
      <Confirm
        title={t('title')}
        description={t('description')}
        okText={t('okText')}
        cancelText={t('cancelText')}
      />
    )
    if (!confirmed) return
    dispatch(fillGoals(month))
  }

  if (!canComplete) return null

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto min-h-10 w-full whitespace-normal py-2"
      onClick={completeAll}
    >
      {t('trigger')}
    </Button>
  )
}
