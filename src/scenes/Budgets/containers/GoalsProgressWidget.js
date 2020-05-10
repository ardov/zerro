import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { formatMoney } from 'helpers/format'
import { getUserCurrencyCode } from 'store/serverData'
import { Typography, Tooltip, makeStyles, ButtonBase } from '@material-ui/core'
import WithConfirm from 'components/Confirm'
import { getGoalsProgress } from '../selectors/goalsProgress'
import { round } from 'helpers/currencyHelpers'
import { getGoals } from 'store/localData/hiddenData'
import { fillGoals } from '../thunks'
import { GOAL_TYPES } from 'store/localData/hiddenData/constants'

const { TARGET_BALANCE } = GOAL_TYPES

const useStyles = makeStyles(({ palette, spacing, shape, shadows }) => ({
  base: {
    display: 'block',
    width: '100%',
    borderRadius: shape.borderRadius,
    padding: spacing(1.5, 1),
    background: palette.background.paper,
    boxShadow: shadows[2],
    position: 'relative',
    overflow: 'hidden',
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
}))

export default function GoalsProgressWidget({ month, ...rest }) {
  const dispatch = useDispatch()
  const currency = useSelector(getUserCurrencyCode)
  const formatSum = sum => formatMoney(sum, currency)
  const goalProgress = useSelector(state => getGoalsProgress(state)?.[month])
  const goals = useSelector(getGoals)
  const onOk = () => dispatch(fillGoals(month))

  let needSum = 0
  let targetSum = 0

  for (const tag in goalProgress) {
    if (goals[tag].type === TARGET_BALANCE && !goals[tag].end) continue
    const { target = 0, need = 0 } = goalProgress[tag]
    if (need > 0) needSum = round(needSum + need)
    if (target > 0) targetSum = round(targetSum + target)
  }

  const progress = targetSum ? (targetSum - needSum) / targetSum : 0
  const c = useStyles({ progress })

  return (
    <WithConfirm
      title="Выполнить все цели?"
      description="Бюджеты будут выставлены так, чтобы цели в этом месяце выполнились."
      onOk={onOk}
      okText="Выполнить цели"
      cancelText="Отмена"
    >
      <Tooltip
        arrow
        interactive
        title={
          needSum
            ? `${formatSum(targetSum - needSum)} из ${formatSum(targetSum)}`
            : `Всего нужно было ${formatSum(targetSum)}`
        }
      >
        <ButtonBase {...rest} className={c.base}>
          <div className={c.progress} />
          {targetSum ? (
            <>
              <Typography
                noWrap
                align="center"
                variant="h5"
                color="textPrimary"
              >
                {needSum > 0 ? formatSum(needSum) : '🥳'}
              </Typography>
              <Typography
                noWrap
                align="center"
                variant="body2"
                color="textSecondary"
              >
                {needSum > 0 ? 'Ещё нужно на цели' : 'Цели выполнены'}
              </Typography>
            </>
          ) : (
            <>
              <Typography
                noWrap
                align="center"
                variant="h5"
                color="textPrimary"
              >
                🏔
              </Typography>
              <Typography
                noWrap
                align="center"
                variant="body2"
                color="textSecondary"
              >
                Пока целей нет
              </Typography>
            </>
          )}
        </ButtonBase>
      </Tooltip>
    </WithConfirm>
  )
}
