import React, { FC } from 'react'
import { useAppDispatch, useAppSelector } from 'store'
import { Box, Typography, Button } from '@mui/material'
import { WarningIcon } from 'shared/ui/Icons'
import { Amount } from 'components/Amount'
import { Confirm } from 'shared/ui/Confirm'
import { overspendModel } from './model'
import { TISOMonth } from 'shared/types'

export const OverspendNotice: FC<{ month: TISOMonth }> = ({ month }) => {
  const dispatch = useAppDispatch()
  const { totalOverspendValue, currency, envelopes } = useAppSelector(
    overspendModel.get
  )?.[month]

  if (totalOverspendValue === 0) return null
  console.log('Overspending envelopes', envelopes)

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
