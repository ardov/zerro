import React, { FC } from 'react'
import { Typography, ButtonBase, ButtonBaseProps } from '@mui/material'
import { TISOMonth } from '@shared/types'
import { formatMoney } from '@shared/helpers/money'
import { Tooltip } from '@shared/ui/Tooltip'
import { Confirm } from '@shared/ui/Confirm'
import { RadialProgress } from '@shared/ui/RadialProgress'
import { useAppDispatch, useAppSelector } from '@store'

import { useDisplayCurrency, useToDisplay } from '@entities/displayCurrency'
import { goalModel } from '@entities/goal'
import { totalGoalsModel } from '../model'

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

export const GoalsProgress: FC<TGoalsProgressProps> = props => {
  const { month, ...btnProps } = props
  const dispatch = useAppDispatch()
  const [currency] = useDisplayCurrency()
  const toDisplay = useToDisplay(month)
  const totalProgress = useAppSelector(goalModel.getTotals)[month]
  const formatSum = (sum: number) => formatMoney(sum, currency)

  const onOk = () => dispatch(totalGoalsModel.fillAll(month))
  // const isMobile = useMediaQuery<Theme>(theme => theme.breakpoints.down('sm'))

  // No goals
  if (!totalProgress || totalProgress.goalsCount === 0) return null

  const { need, target, progress } = totalProgress
  const targetValue = toDisplay(target)
  const needValue = toDisplay(need)

  // All completed
  // if (totalProgress.progress === 1) {
  //   return (
  //     <Tooltip arrow title={`Всего нужно было ${formatSum(targetValue)}`}>
  //       <StyledBase {...btnProps}>
  //         <Typography variant="body1">🥳 Цели выполнены</Typography>
  //       </StyledBase>
  //     </Tooltip>
  //   )
  // }

  return (
    <Confirm
      title="Выполнить все цели?"
      description="Бюджеты будут выставлены так, чтобы цели в этом месяце выполнились."
      onOk={onOk}
      okText="Выполнить цели"
      cancelText="Отмена"
    >
      <Tooltip
        arrow
        title={`${formatSum(targetValue - needValue)} из ${formatSum(
          targetValue
        )}`}
      >
        <ButtonBase sx={baseStyles} {...btnProps}>
          <RadialProgress value={progress} />
          <Typography variant="body1">
            Цели {Math.floor(progress * 100)}%
          </Typography>
        </ButtonBase>
      </Tooltip>
    </Confirm>
  )
}
