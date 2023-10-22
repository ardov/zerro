import React, { FC } from 'react'
import { Typography, ButtonBase, ButtonBaseProps } from '@mui/material'
import { TISOMonth } from '6-shared/types'
import { formatMoney } from '6-shared/helpers/money'
import { Tooltip } from '6-shared/ui/Tooltip'
import { RadialProgress } from '6-shared/ui/RadialProgress'
import { useAppDispatch, useAppSelector } from 'store'

import { displayCurrency } from '5-entities/currency/displayCurrency'
import { goalModel } from '5-entities/goal'
import { totalGoalsModel } from '../model'
import { useConfirm } from '6-shared/ui/SmartConfirm'

type TGoalsProgressProps = ButtonBaseProps & {
  month: TISOMonth
}

const baseStyles = {
  bgcolor: 'background.paper',
  borderRadius: 1,
  py: 1,
  px: 2,
  display: 'flex',
  gap: 1,
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '40px',
}

// TODO: i18n
export const GoalsProgress: FC<TGoalsProgressProps> = props => {
  const { month, ...btnProps } = props
  const dispatch = useAppDispatch()
  const [currency] = displayCurrency.useDisplayCurrency()
  const toDisplay = displayCurrency.useToDisplay(month)
  const totalProgress = useAppSelector(goalModel.getTotals)[month]
  const formatSum = (sum: number) => formatMoney(sum, currency)

  const completeAll = useConfirm({
    onOk: () => dispatch(totalGoalsModel.fillAll(month)),
    okText: 'Выполнить цели',
    title: 'Выполнить все цели?',
    description:
      'Бюджеты будут выставлены так, чтобы цели в этом месяце выполнились.',
    cancelText: 'Отмена',
  })

  // No goals
  if (!totalProgress || totalProgress.goalsCount === 0) return null

  const { need, target, progress } = totalProgress
  const targetValue = toDisplay(target)
  const needValue = toDisplay(need)
  if (!targetValue || !needValue) return null

  return (
    <Tooltip
      arrow
      title={`${formatSum(targetValue - needValue)} из ${formatSum(
        targetValue
      )}`}
    >
      <ButtonBase sx={baseStyles} {...btnProps} onClick={completeAll}>
        <RadialProgress value={progress} />
        <Typography variant="body1">
          Цели {Math.floor(progress * 100)}%
        </Typography>
      </ButtonBase>
    </Tooltip>
  )
}
