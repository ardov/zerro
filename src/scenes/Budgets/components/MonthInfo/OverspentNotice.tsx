import React, { FC } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { getUserCurrencyCode } from 'store/data/instruments'
import { Box, Typography, Button } from '@mui/material'
import { WarningIcon } from 'components/Icons'
import { Amount } from 'components/Amount'
import { Confirm } from 'components/Confirm'
import { fixOverspends } from 'scenes/Budgets/thunks'
import { getTotalsByMonth } from 'scenes/Budgets/selectors'
import { useMonth } from 'scenes/Budgets/pathHooks'

export const OverspentNotice: FC = () => {
  const [month] = useMonth()
  const overspent = useSelector(getTotalsByMonth)?.[month]?.overspent
  const currency = useSelector(getUserCurrencyCode)
  const dispatch = useDispatch()

  return (
    <Box
      sx={{
        p: 2,
        bgcolor: 'background.default',
        borderRadius: 1,
        display: 'flex',
        flexDirection: 'row',
      }}
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
