import type { TFxCode, TISOMonth } from '6-shared/types'
import { useCoreDisplayCurrency } from 'zerro-core/redux'
import {
  editFxRates,
  resetFxRates,
  selectCoreFxRatesGetter,
  selectCoreMonthTotals,
  type TFxRates,
} from 'zerro-core/redux'
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
import { keys } from '6-shared/helpers/keys'
import { useDebouncedCallback } from '6-shared/hooks/useDebouncedCallback'
import { useToggle } from '6-shared/hooks/useToggle'
import { formatDate } from '6-shared/helpers/date'

import { useAppDispatch, useAppSelector } from 'store'
import { canFetchFxRates, loadFxRates } from '4-features/fxRates'

export const FxRates: FC<{ month: TISOMonth }> = props => {
  const dispatch = useAppDispatch()
  const { month } = props
  const { t } = useTranslation('fxRates')
  const [displCurrency] = useCoreDisplayCurrency()
  const funds = useAppSelector(selectCoreMonthTotals)[month].fundsEnd
  const ratesGetter = useAppSelector(selectCoreFxRatesGetter)
  const rateData = ratesGetter(month)

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
  const canFetch = canFetchFxRates(month)
  const isCurrentRates = rateData.type === 'current'

  return (
    <Box
      sx={{
        p: 2,
        bgcolor: 'background.default',
        borderRadius: 1,
      }}
    >
      <Stack
        sx={{
          gap: 1,
        }}
      >
        {currencies.map(c => (
          <FxRateInput
            key={c.code + month}
            code={c.code}
            mainCode={displCurrency}
            rates={rateData.rates}
            onChange={rate => dispatch(editFxRates(month, { [c.code]: rate }))}
          />
        ))}
        <Typography
          variant="caption"
          align="center"
          sx={{
            color: 'text.secondary',
          }}
        >
          {t(isCurrentRates ? 'title_current' : 'title', {
            date: formatDate(rateData.date, 'LLLL yyyy'),
          })}
        </Typography>
        {isSaved && (
          <Button fullWidth onClick={() => dispatch(resetFxRates(month))}>
            {t('reset')}
          </Button>
        )}
        {canFetch && !isSaved && (
          <Button fullWidth onClick={() => dispatch(loadFxRates(month))}>
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
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start" children={`1 ${leftCode} =`} />
          ),
          endAdornment: (
            <InputAdornment
              position="end"
              children={rightCode}
              onClick={swap}
            />
          ),
        },

        htmlInput: { type: 'tel' },
      }}
    />
  )
}

const roundRate = (r: number) => Math.round(r * 1000) / 1000
