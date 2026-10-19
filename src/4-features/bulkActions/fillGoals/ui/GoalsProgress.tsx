import type { ButtonBaseProps } from '@/6-shared/ui/kit/ButtonBase'
import { ButtonBase } from '@/6-shared/ui/kit/ButtonBase'
import type { FC } from 'react'
import { core } from '@/zerro-core/redux'

import type { TISOMonth } from '@/6-shared/types'
import { formatMoney } from '@/6-shared/helpers/money'
import { Tooltip } from '@/6-shared/ui/kit/Tooltip'
import { RadialProgress } from '@/6-shared/ui/kit/RadialProgress'
import { useAppDispatch, useAppSelector } from '@/store'

import { fillGoals } from '../model/fillGoals'
import { useSnackbar } from '@/6-shared/ui/SnackbarProvider'
import { useTranslation } from 'react-i18next'

type TGoalsProgressProps = ButtonBaseProps & {
  month: TISOMonth
}

const baseStyles =
  'flex min-h-10 items-center justify-center gap-2 rounded-lg bg-ui-card px-4 py-2'

export const GoalsProgress: FC<TGoalsProgressProps> = props => {
  const { t } = useTranslation('goals')
  const { month, ...btnProps } = props
  const [currency] = core.currency.useDisplayCurrency()
  const toDisplay = core.currency.useToDisplay(month)
  const totalProgress = useAppSelector(core.goals.selectTotals)[month]
  const formatSum = (sum: number) => formatMoney(sum, currency)

  const dispatch = useAppDispatch()
  const snackbar = useSnackbar()
  const completeAll = () => {
    dispatch(fillGoals(month))
    snackbar({ message: t('completeAll.done') })
  }

  // No goals
  if (!totalProgress || totalProgress.goalsCount === 0) return null

  const { need, target, progress } = totalProgress
  const targetValue = toDisplay(target)
  const needValue = toDisplay(need)
  if (!targetValue || !needValue) return null

  return (
    <Tooltip
      content={t('progressOnTagret', {
        assigned: formatSum(targetValue - needValue),
        target: formatSum(targetValue),
      })}
    >
      <ButtonBase className={baseStyles} {...btnProps} onClick={completeAll}>
        <RadialProgress value={progress} />
        <span className="text-body font-sans">
          {t('goalsProgress', { percent: Math.floor(progress * 100) })}
        </span>
      </ButtonBase>
    </Tooltip>
  )
}
