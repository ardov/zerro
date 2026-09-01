import type { ButtonBaseProps } from '@/6-shared/ui/Button'
import { ButtonBase } from '@/6-shared/ui/Button'
import type { FC } from 'react'
import { core } from '@/zerro-core/redux'

import type { TISOMonth } from '@/6-shared/types'
import { formatMoney } from '@/6-shared/helpers/money'
import { Tooltip } from '@/6-shared/ui/Tooltip'
import { RadialProgress } from '@/6-shared/ui/RadialProgress'
import { useAppDispatch, useAppSelector } from '@/store'

import { fillGoals } from '../model/fillGoals'
import { useAsk } from '@/6-shared/overlays'
import { Confirm } from '@/6-shared/ui/Confirm'
import { useTranslation } from 'react-i18next'

type TGoalsProgressProps = ButtonBaseProps & {
  month: TISOMonth
}

const baseStyles =
  'flex min-h-10 items-center justify-center gap-2 rounded-lg bg-card px-4 py-2'

export const GoalsProgress: FC<TGoalsProgressProps> = props => {
  const { t } = useTranslation('goals')
  const { month, ...btnProps } = props
  const dispatch = useAppDispatch()
  const [currency] = core.currency.useDisplayCurrency()
  const toDisplay = core.currency.useToDisplay(month)
  const totalProgress = useAppSelector(core.goals.selectTotals)[month]
  const formatSum = (sum: number) => formatMoney(sum, currency)

  const ask = useAsk()
  const completeAll = async () => {
    const confirmed = await ask(
      <Confirm
        title={t('completeAll.title')}
        description={t('completeAll.description')}
        okText={t('completeAll.okText')}
        cancelText={t('completeAll.cancelText')}
      />
    )
    if (!confirmed) return
    dispatch(fillGoals(month))
  }

  // No goals
  if (!totalProgress || totalProgress.goalsCount === 0) return null

  const { need, target, progress } = totalProgress
  const targetValue = toDisplay(target)
  const needValue = toDisplay(need)
  if (!targetValue || !needValue) return null

  return (
    <Tooltip
      arrow
      title={t('progressOnTagret', {
        assigned: formatSum(targetValue - needValue),
        target: formatSum(targetValue),
      })}
    >
      <ButtonBase className={baseStyles} {...btnProps} onClick={completeAll}>
        <RadialProgress value={progress} />
        <span className="type-body font-sans">
          {t('goalsProgress', { percent: Math.floor(progress * 100) })}
        </span>
      </ButtonBase>
    </Tooltip>
  )
}
