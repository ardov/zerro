import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { formatMoney } from 'helpers/format'
import { getUserCurrencyCode } from 'store/data/selectors'
import {
  Typography,
  ButtonBase,
  useMediaQuery,
  useTheme,
} from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { Tooltip } from 'components/Tooltip'
import { Confirm } from 'components/Confirm'
import { fillGoals } from '../thunks'
import { getTotalGoalsProgress } from '../selectors/goalsProgress'

const useStyles = makeStyles(
  ({ palette, spacing, shape, shadows, breakpoints }) => ({
    base: {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      borderRadius: shape.borderRadius,
      padding: spacing(1.5, 2),
      background: palette.background.paper,
      boxShadow: shadows[2],
      position: 'relative',
      overflow: 'hidden',

      [breakpoints.down('xs')]: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
      },
    },
    paper: {
      position: 'relative',
      overflow: 'hidden',
    },
    progress: {
      position: 'absolute',
      width: '100%',

      transform: ({ progress }) => `scaleX(${1 - progress})`,
      transformOrigin: 'right',
      top: 0,
      bottom: 0,
      right: -1,
      backgroundColor: palette.action.selected,
      willChange: 'transform',
      transition: '0.4s ease-in-out',
    },
  })
)

export default function GoalsProgressWidget({ month, className, ...rest }) {
  const dispatch = useDispatch()
  const currency = useSelector(getUserCurrencyCode)
  const formatSum = sum => formatMoney(sum, currency)
  const totals = useSelector(getTotalGoalsProgress)?.[month]
  const { need, target, progress } = totals || {}
  const onOk = () => dispatch(fillGoals(month))
  const c = useStyles({ progress })
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  if (!totals)
    return (
      <ButtonBase {...rest} className={`${c.base} ${className}`}>
        <Typography noWrap align="center" variant="h5" color="textPrimary">
          🏔
        </Typography>
        <Typography noWrap align="center" variant="body2" color="textSecondary">
          Пока целей нет
        </Typography>
      </ButtonBase>
    )

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
        <ButtonBase {...rest} className={`${c.base} ${className}`}>
          <div className={c.progress} />
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
        </ButtonBase>
      </Tooltip>
    </Confirm>
  )
}
