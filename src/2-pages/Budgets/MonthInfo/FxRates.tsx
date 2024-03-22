import React, { FC, useEffect, useState } from 'react'
import {
  Box,
  Button,
  TextField,
  InputAdornment,
  Stack,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { TFxCode, TISOMonth } from '6-shared/types'
import { keys } from '6-shared/helpers/keys'
import { useDebouncedCallback } from '6-shared/hooks/useDebouncedCallback'
import { useToggle } from '6-shared/hooks/useToggle'
import { formatDate, toISOMonth } from '6-shared/helpers/date'

import { useAppDispatch } from 'store'
import { displayCurrency } from '5-entities/currency/displayCurrency'
import { fxRateModel, TFxRates } from '5-entities/currency/fxRate'
import { balances } from '5-entities/envBalances'

export const FxRates: FC<{ month: TISOMonth }> = props => {
  const dispatch = useAppDispatch()
  const { month } = props
  const { t } = useTranslation('fxRates')
  const [displCurrency] = displayCurrency.useDisplayCurrency()
  const funds = balances.useTotals()[month].fundsEnd
  const rateData = balances.useRates()[month]

  const currencies = keys(funds)
    .map(code => {
      return {
        code,
        amount: funds[code],
        rate: rateData.rates[code] / rateData.rates[displCurrency],
      }
    })
    .sort((a, b) => b.amount - a.amount)
    .filter(c => c.code !== displCurrency)

  if (currencies.length === 0) return null

  const isSaved = rateData.type === 'saved' && rateData.date === month
  const canFetch =
    toISOMonth(Date.now()) > month && fxRateModel.canFetchRates(month)
  const isCurrentRates = rateData.type === 'current'

  return (
    <Box p={2} bgcolor="background.default" borderRadius={1}>
      <Stack gap={1}>
        {currencies.map(c => (
          <FxRateInput
            key={c.code + month}
            code={c.code}
            mainCode={displCurrency}
            rates={rateData.rates}
            onChange={rate =>
              dispatch(fxRateModel.edit({ [c.code]: rate }, month))
            }
          />
        ))}
        <Typography variant="caption" color="textSecondary" align="center">
          {t(isCurrentRates ? 'title_current' : 'title', {
            date: formatDate(rateData.date, 'LLLL yyyy'),
          })}
        </Typography>
        {isSaved && (
          <Button fullWidth onClick={() => dispatch(fxRateModel.reset(month))}>
            {t('reset')}
          </Button>
        )}
        {canFetch && !isSaved && (
          <Button fullWidth onClick={() => dispatch(fxRateModel.load(month))}>
            {t('download')}
          </Button>
        )}
      </Stack>
    </Box>
  )
}

const FxRateInput: FC<{
  code: TFxCode
  mainCode: TFxCode
  rates: TFxRates
  onChange: (rate: number) => void
}> = props => {
  const { code, mainCode, rates, onChange } = props

  const [isSwapped, swap] = useToggle()
  const [focused, setFocused] = useState(false)

  const leftCode = isSwapped ? mainCode : code
  const rightCode = isSwapped ? code : mainCode
  const rate = roundRate(rates[leftCode] / rates[rightCode])

  const [value, setValue] = useState(String(rate))

  // Update rate when not focused
  useEffect(() => {
    if (!focused) setValue(String(rate))
  }, [rate, focused])

  const onChg = useDebouncedCallback(
    (v: string) =>
      +v > 0 &&
      +v !== rate &&
      onChange(isSwapped ? rates[mainCode] / +v : +v * rates[mainCode]),
    [onChange, isSwapped, rates],
    400
  )

  return (
    <TextField
      key={code}
      size="small"
      value={value}
      onChange={e => {
        setValue(e.target.value)
        onChg(e.target.value)
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      inputProps={{ type: 'tel' }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start" children={`1 ${leftCode} =`} />
        ),
        endAdornment: (
          <InputAdornment position="end" children={rightCode} onClick={swap} />
        ),
      }}
    />
  )
}

const roundRate = (r: number) => Math.round(r * 1000) / 1000
