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

type TGoalsProgressProps = ButtonBaseProps & {
  month: TISOMonth
}

export const GoalsProgress: FC<TGoalsProgressProps> = props => {
  const { month, ...btnProps } = props
  const dispatch = useAppDispatch()
  const currency = useDisplayCurrency()
  const totalProgress = useAppSelector(totalGoalsModel.getTotals)[month]
  const formatSum = (sum: number) => formatMoney(sum, currency)

  const onOk = () => dispatch(totalGoalsModel.fillAll(month))
  const isMobile = useMediaQuery<Theme>(theme => theme.breakpoints.down('sm'))

  if (!totalProgress || totalProgress.goalsCount === 0) {
    return (
      <StyledBase {...btnProps}>
        <Typography noWrap align="center" variant="h5" color="textPrimary">
          🚩
        </Typography>
        <Typography noWrap align="center" variant="body2" color="textSecondary">
          Пока целей нет
        </Typography>
      </StyledBase>
    )
  }

  const { needValue, targetValue, progress } = totalProgress

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
        title={
          needValue
            ? `${formatSum(targetValue - needValue)} из ${formatSum(
                targetValue
              )}`
            : `Всего нужно было ${formatSum(targetValue)}`
        }
      >
        <StyledBase {...props}>
          <Bar style={{ transform: `scaleX(${1 - progress})` }} />
          <Typography
            noWrap
            align="center"
            variant={isMobile ? 'body1' : 'h5'}
            color="textPrimary"
          >
            {needValue > 0 ? formatSum(needValue) : '🥳'}
          </Typography>
          <Typography
            noWrap
            align="center"
            variant={isMobile ? 'body1' : 'body2'}
            color="textSecondary"
          >
            {needValue > 0 ? 'Ещё нужно на цели' : 'Цели выполнены'}
          </Typography>
        </StyledBase>
      </Tooltip>
    </Confirm>
  )
}

const StyledBase = styled(ButtonBase)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(1.5, 2),
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
