import type { TFxCode, TISOMonth } from '6-shared/types'
import { core } from 'zerro-core/redux'

import type { FC } from 'react'
import { useState } from 'react'
import { Button, TextField, InputAdornment, Typography } from '@mui/material'
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
  const [displCurrency] = core.currency.useDisplayCurrency()
  const funds = useAppSelector(core.months.selectTotals)[month].fundsEnd
  const ratesGetter = useAppSelector(core.fxRates.selectGetter)
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
    <div className="rounded-lg bg-background p-4">
      <div className="flex flex-col gap-2">
        {currencies.map(c => (
          <FxRateInput
            key={c.code + month}
            code={c.code}
            mainCode={displCurrency}
            rates={rateData.rates}
            onChange={rate =>
              dispatch(core.fxRates.edit(month, { [c.code]: rate }))
            }
          />
        ))}
        <Typography
          variant="caption"
          align="center"
          className="text-muted-foreground"
        >
          {t(isCurrentRates ? 'title_current' : 'title', {
            date: formatDate(rateData.date, 'LLLL yyyy'),
          })}
        </Typography>
        {isSaved && (
          <Button fullWidth onClick={() => dispatch(core.fxRates.reset(month))}>
            {t('reset')}
          </Button>
        )}
        {canFetch && !isSaved && (
          <Button fullWidth onClick={() => dispatch(loadFxRates(month))}>
            {t('download')}
          </Button>
        )}
      </div>
    </div>
  )
}

const FxRateInput: FC<{
  code: TFxCode
  mainCode: TFxCode
  rates: core.fxRates.TFxRates
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
  const [prevRate, setPrevRate] = useState({ rate, focused })
  if (prevRate.rate !== rate || prevRate.focused !== focused) {
    setPrevRate({ rate, focused })
    if (!focused) setValue(String(rate))
  }

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
