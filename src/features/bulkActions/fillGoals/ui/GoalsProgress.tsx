import React, { FC } from 'react'
import {
  Typography,
  ButtonBase,
  useMediaQuery,
  ButtonBaseProps,
  Theme,
  Box,
} from '@mui/material'
import { styled } from '@mui/styles'
import { TISOMonth } from '@shared/types'
import { formatMoney } from '@shared/helpers/money'
import { Tooltip } from '@shared/ui/Tooltip'
import { Confirm } from '@shared/ui/Confirm'
import { useAppDispatch, useAppSelector } from '@store'
import { totalGoalsModel } from '../model'
import { useDisplayCurrency } from '@entities/instrument/hooks'
import { RadialProgress } from '@shared/ui/RadialProgress'

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
  const currency = useDisplayCurrency()
  const totalProgress = useAppSelector(totalGoalsModel.getTotals)[month]
  const formatSum = (sum: number) => formatMoney(sum, currency)

  const onOk = () => dispatch(totalGoalsModel.fillAll(month))
  const isMobile = useMediaQuery<Theme>(theme => theme.breakpoints.down('sm'))

  // No goals
  if (!totalProgress || totalProgress.goalsCount === 0) {
    return (
      <ButtonBase sx={baseStyles} {...btnProps}>
        <Typography variant="body1">🚩 Пока целей нет</Typography>
      </ButtonBase>
    )
  }

  const { needValue, targetValue, progress } = totalProgress

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

const StyledBase = styled(ButtonBase)(({ theme }) => ({
  display: 'flex',
  borderRadius: theme.shape.borderRadius,
  // padding: theme.spacing(1.5, 2),
  background: theme.palette.background.paper,
  boxShadow: theme.shadows[2],
  position: 'relative',
  overflow: 'hidden',

  [theme.breakpoints.down('xs')]: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
}))

const Bar = styled(Box)(({ theme }) => ({
  position: 'absolute',
  width: '100%',
  transformOrigin: 'right',
  top: 0,
  bottom: 0,
  right: -1,
  backgroundColor: theme.palette.action.selected,
  willChange: 'transform',
  transition: '0.4s ease-in-out',
}))
