import React, { FC } from 'react'
import { useAppDispatch, useAppSelector } from 'store'
import { getUserCurrencyCode } from 'models/instrument'
import { Box, Typography, Button } from '@mui/material'
import { WarningIcon } from 'shared/ui/Icons'
import { SmartAmount } from 'components/Amount'
import { Confirm } from 'shared/ui/Confirm'
import { fixOverspends } from 'pages/BudgetsOld/thunks'
import { getTotalsByMonth } from 'pages/BudgetsOld/selectors'
import { useMonth } from 'pages/BudgetsOld/pathHooks'

export const OverspentNotice: FC = () => {
  const [month] = useMonth()
  const overspent = useAppSelector(getTotalsByMonth)?.[month]?.overspent
  const currency = useAppSelector(getUserCurrencyCode)
  const dispatch = useAppDispatch()

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
          Перерасход{' '}
          <SmartAmount value={overspent} currency={currency} noShade />.
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
