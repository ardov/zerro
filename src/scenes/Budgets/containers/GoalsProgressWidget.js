import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { formatMoney } from 'helpers/format'
import { getUserCurrencyCode } from 'store/serverData'
import { Paper, Box, Typography, Tooltip } from '@material-ui/core'
import Confirm from 'components/Confirm'
import { getGoalsProgress } from '../selectors/goalsProgress'
import { round } from 'helpers/currencyHelpers'
import { getGoals } from 'store/localData/hiddenData'
import { fillGoals } from '../thunks'
import { GOAL_TYPES } from 'store/localData/hiddenData/constants'
const { TARGET_BALANCE } = GOAL_TYPES

export default function GoalsProgressWidget({ month, ...rest }) {
  const dispatch = useDispatch()
  const currency = useSelector(getUserCurrencyCode)
  const goalProgress = useSelector(state => getGoalsProgress(state)?.[month])
  const goals = useSelector(getGoals)

  let needSum = 0
  let targetSum = 0

  for (const tag in goalProgress) {
    if (goals[tag].type === TARGET_BALANCE && !goals[tag].end) continue
    const { target = 0, need = 0 } = goalProgress[tag]
    needSum = round(needSum + need)
    targetSum = round(targetSum + target)
  }

  const formatSum = sum => formatMoney(sum, currency)

  return (
    <Paper {...rest}>
      <Confirm
        title="Выполнить все цели?"
        description="Бюджеты будут выставлены так, чтобы цели в этом месяце выполнились."
        onOk={() => dispatch(fillGoals(month))}
        okText="Выполнить цели"
        cancelText="Отмена"
      >
        <Tooltip
          arrow
          title={`Нажмите, чтобы распределить деньги по целям. Всего нужно ${formatSum(
            targetSum
          )}`}
        >
          <Box py={1.5}>
            <Typography noWrap align="center" variant="h5" color="textPrimary">
              {needSum > 0 ? formatSum(needSum) : '👍'}
            </Typography>
            <Typography
              noWrap
              align="center"
              variant="body2"
              color="textSecondary"
            >
              {needSum > 0 ? 'Ещё нужно на цели' : 'Цели выполнены'}
            </Typography>
          </Box>
        </Tooltip>
      </Confirm>
    </Paper>
  )
}
