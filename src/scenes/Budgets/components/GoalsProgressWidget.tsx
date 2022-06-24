import React, { FC } from 'react'
import { useAppDispatch, useAppSelector } from 'store'
import { formatMoney } from 'shared/helpers/format'
import { getUserCurrencyCode } from 'store/data/instruments'
import {
  Typography,
  ButtonBase,
  useMediaQuery,
  ButtonBaseProps,
  Theme,
  Box,
} from '@mui/material'
import { styled } from '@mui/styles'
import { Tooltip } from 'shared/ui/Tooltip'
import { Confirm } from 'shared/ui/Confirm'
import { fillGoals } from '../thunks'
import { getTotalGoalsProgress } from '../selectors'
import { useMonth } from '../pathHooks'

export const GoalsProgressWidget: FC<ButtonBaseProps> = props => {
  const dispatch = useAppDispatch()
  const [month] = useMonth()
  const currency = useAppSelector(getUserCurrencyCode)
  const formatSum = (sum: number) => formatMoney(sum, currency)
  const totals = useAppSelector(getTotalGoalsProgress)?.[month]
  const onOk = () => dispatch(fillGoals(month))
  const isMobile = useMediaQuery<Theme>(theme => theme.breakpoints.down('sm'))

  if (!totals) {
    return (
      <StyledBase {...props}>
        <Typography noWrap align="center" variant="h5" color="textPrimary">
          🚩
        </Typography>
        <Typography noWrap align="center" variant="body2" color="textSecondary">
          Пока целей нет
        </Typography>
      </StyledBase>
    )
  }

  const { need, target, progress } = totals

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
          need
            ? `${formatSum(target - need)} из ${formatSum(target)}`
            : `Всего нужно было ${formatSum(target)}`
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
            {need > 0 ? formatSum(need) : '🥳'}
          </Typography>
          <Typography
            noWrap
            align="center"
            variant={isMobile ? 'body1' : 'body2'}
            color="textSecondary"
          >
            {need > 0 ? 'Ещё нужно на цели' : 'Цели выполнены'}
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
