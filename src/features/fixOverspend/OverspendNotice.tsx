import React, { FC } from 'react'
import { Box, Typography, Button } from '@mui/material'
import { TISOMonth } from 'shared/types'
import { Amount } from 'shared/ui/Amount'
import { WarningIcon } from 'shared/ui/Icons'
import { Confirm } from 'shared/ui/Confirm'
import { useAppDispatch, useAppSelector } from 'store'
import { overspendModel } from './model'

export const OverspendNotice: FC<{ month: TISOMonth }> = ({ month }) => {
  const dispatch = useAppDispatch()
  const { totalOverspendValue, currency } = useAppSelector(
    overspendModel.get
  )?.[month]

  if (totalOverspendValue === 0) return null

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
          <Amount value={-totalOverspendValue} currency={currency} noShade />.
        </Typography>
        <Typography variant="body2">
          Добавьте денег в категории с отрицательным балансом, чтобы быть
          уверенным в бюджете.
        </Typography>
        <Box mt={1} ml={-1}>
          <Confirm
            title="Избавиться от перерасходов?"
            onOk={() => dispatch(overspendModel.fixAll(month))}
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
