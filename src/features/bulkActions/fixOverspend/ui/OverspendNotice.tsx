import React, { FC } from 'react'
import { Box, Typography, Button } from '@mui/material'
import { TISOMonth } from '@shared/types'
import { WarningIcon } from '@shared/ui/Icons'
import { Confirm } from '@shared/ui/Confirm'
import { useAppDispatch } from '@store'
import { overspendModel } from '../model'
import { balances } from '@entities/envBalances'
import { DisplayAmount } from '@entities/currency/displayCurrency'
import { isZero } from '@shared/helpers/money'

export const OverspendNotice: FC<{ month: TISOMonth }> = ({ month }) => {
  const dispatch = useAppDispatch()
  const { overspend } = balances.useTotals()[month]

  if (isZero(overspend)) return null

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
          <DisplayAmount
            value={overspend}
            month={month}
            noShade
            sign={false}
            decMode="ifAny"
          />
          .
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
            elKey="coverOverspendsConfirm"
          >
            <Button color="secondary">Исправить автоматически</Button>
          </Confirm>
        </Box>
      </Box>
    </Box>
  )
}
