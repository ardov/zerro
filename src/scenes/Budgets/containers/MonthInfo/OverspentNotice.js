import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { getUserCurrencyCode } from 'store/serverData'
import { Box, Typography, Button } from '@material-ui/core'
import WarningIcon from '@material-ui/icons/Warning'
import { Amount } from 'components/Amount'
import Confirm from 'components/Confirm'
import { fixOverspends } from 'scenes/Budgets/thunks'
import { getTotalsByMonth } from 'scenes/Budgets/selectors/getTotalsByMonth'
import { useMonth } from 'scenes/Budgets/pathHooks'

export function OverspentNotice(props) {
  const [month] = useMonth()
  const overspent = useSelector(getTotalsByMonth)?.[month]?.overspent
  const currency = useSelector(getUserCurrencyCode)
  const dispatch = useDispatch()

  return (
    <Box
      p={2}
      bgcolor="background.default"
      borderRadius={8}
      display="flex"
      flexDirection="row"
    >
      <Box color="warning.main" pt="2px">
        <WarningIcon />
      </Box>
      <Box ml={1.5}>
        <Typography variant="subtitle1">
          Перерасход <Amount value={overspent} currency={currency} noShade />.
        </Typography>
        <Typography variant="body2">
          Добавьте денег в категории с отрицательным балансом, чтобы быть
          уверенным в бюджете.
        </Typography>
        <Box mt={1} ml={-1}>
          <Confirm
            title="Избавиться от перерасходов?"
            onOk={() => dispatch(fixOverspends(month))}
            okText="Покрыть перерасходы"
            cancelText="Отмена"
          >
            <Button color="secondary">Исправить автоматически</Button>
          </Confirm>
        </Box>
      </Box>
    </Box>
  )
}
