import React, { FC, useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@store'
import {
  Box,
  Button,
  TextField,
  InputAdornment,
  Stack,
  Typography,
} from '@mui/material'
import { TFxCode, TISOMonth } from '@shared/types'
import { useDisplayCurrency } from '@entities/instrument/hooks'
import { getMonthTotals } from '@entities/envelopeData'
import { fxRates, TFxRates } from '@entities/fxRate'
import { keys } from '@shared/helpers/keys'
import { useDebouncedCallback } from '@shared/hooks/useDebouncedCallback'
import { useToggle } from '@shared/hooks/useToggle'
import { formatDate } from '@shared/helpers/date'

export const FxRates: FC<{ month: TISOMonth }> = props => {
  const dispatch = useAppDispatch()
  const { month } = props
  const totals = useAppSelector(getMonthTotals)[month]
  const displayCurrency = useDisplayCurrency()
  const funds = totals.fundsEnd
  const rateData = useAppSelector(fxRates.getter)(month)

  const currencies = keys(funds)
    .map(code => {
      return {
        code,
        amount: funds[code],
        rate: rateData.rates[code] / rateData.rates[displayCurrency],
      }
    })
    .sort((a, b) => b.amount - a.amount)
    .filter(c => c.code !== displayCurrency)

  if (currencies.length === 0) return null

  return (
    <Box p={2} bgcolor="background.default" borderRadius={1}>
      <Stack gap={1}>
        {currencies.map(c => (
          <FxRateInput
            key={c.code + month}
            code={c.code}
            mainCode={displayCurrency}
            rates={rateData.rates}
            onChange={rate => dispatch(fxRates.edit({ [c.code]: rate }, month))}
          />
        ))}
        <Typography variant="caption" color="textSecondary" align="center">
          Курсы на {formatDate(rateData.date, 'LLLL yyyy')}{' '}
          {rateData.type === 'current' && ' (текущие)'}
        </Typography>
        <Button fullWidth onClick={() => dispatch(fxRates.freeze(month))}>
          Загрузить курсы
        </Button>
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
