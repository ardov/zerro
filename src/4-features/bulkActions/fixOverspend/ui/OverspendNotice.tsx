import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Typography, Button } from '@mui/material'
import { TISOMonth } from '6-shared/types'
import { WarningIcon } from '6-shared/ui/Icons'
import { isZero } from '6-shared/helpers/money'
import { useConfirm } from '6-shared/ui/SmartConfirm'
import { useAppDispatch } from 'store'
import { balances } from '5-entities/envBalances'
import { DisplayAmount } from '5-entities/currency/displayCurrency'
import { overspendModel } from '../model'

export const OverspendNotice: FC<{ month: TISOMonth }> = ({ month }) => {
  const { t } = useTranslation('overspendNotice')
  const dispatch = useAppDispatch()
  const { overspend } = balances.useTotals()[month]
  const fixOverspends = useConfirm({
    onOk: () => dispatch(overspendModel.fixAll(month)),
    title: t('confirm.title'),
    okText: t('confirm.okText'),
    cancelText: t('confirm.cancelText'),
  })

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
          {t('title')}{' '}
          <DisplayAmount
            value={overspend}
            month={month}
            noShade
            sign={false}
            decMode="ifAny"
          />
          .
        </Typography>
        <Typography variant="body2">{t('description')}</Typography>

        <Button
          sx={{ mt: 1, ml: -1 }}
          color="secondary"
          onClick={fixOverspends}
        >
          {t('btn')}
        </Button>
      </Box>
    </Box>
  )
}
