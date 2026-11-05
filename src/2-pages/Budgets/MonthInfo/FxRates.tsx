import { Button } from '@/6-shared/ui/kit/Button'
import type { TFxCode, TISOMonth } from '@/6-shared/types'
import { core } from '@/zerro-core/redux'

import type { FC } from 'react'
import { useState } from 'react'
import { FieldAddon } from '@/6-shared/ui/kit/Field'
import { Input } from '@/6-shared/ui/kit/Input'
import { Button as KitButton } from '@/6-shared/ui/kit/Button'
import { useTranslation } from 'react-i18next'
import { keys } from '@/6-shared/helpers/keys'
import { unitsPerWhole } from '@/6-shared/helpers/money/currencyHelpers'
import { useDebouncedCallback } from '@/6-shared/hooks/useDebouncedCallback'
import { useToggle } from '@/6-shared/hooks/useToggle'
import { formatDate } from '@/6-shared/helpers/date'

import { useAppDispatch, useAppSelector } from '@/store'
import { canFetchFxRates, loadFxRates } from '@/4-features/fxRates'

export const FxRates: FC<{ month: TISOMonth }> = props => {
  const dispatch = useAppDispatch()
  const { month } = props
  const { t } = useTranslation('fxRates')
  const [displCurrency] = core.currency.useDisplayCurrency()
  const funds = useAppSelector(core.months.selectTotals)[month].fundsEnd
  const balances = useAppSelector(state =>
    core.balances.selectMonthEnd(state, month)
  )
  const instruments = core.instruments.useByCode()
  const ratesGetter = useAppSelector(core.fxRates.selectGetter)
  const rateData = ratesGetter(month)

  const currencies = new Set(keys(funds).sort((a, b) => funds[b] - funds[a]))
  if (balances) {
    for (const amounts of [
      ...Object.values(balances.accounts),
      ...Object.values(balances.debtors),
    ]) {
      for (const [code, amount] of Object.entries(amounts)) {
        if (amount !== 0) currencies.add(code)
      }
    }
  }
  currencies.delete(displCurrency)
  if (currencies.size === 0) return null

  const isSaved = rateData.type === 'saved' && rateData.date === month
  const canFetch = canFetchFxRates(month)
  const isCurrentRates = rateData.type === 'current'

  return (
    <div className="rounded-lg bg-ui-base p-4">
      <div className="flex flex-col gap-2">
        {Array.from(currencies, code => (
          <FxRateInput
            key={`${month}-${code}-${displCurrency}`}
            code={code}
            mainCode={displCurrency}
            quotePerUnit={rateData.rates[code] / rateData.rates[displCurrency]}
            unitRatio={
              unitsPerWhole(instruments[code]?.symbol) /
              unitsPerWhole(instruments[displCurrency]?.symbol)
            }
            onChange={quotePerUnit =>
              dispatch(
                core.fxRates.setQuote({
                  month,
                  code,
                  quoteCode: displCurrency,
                  quotePerUnit,
                })
              )
            }
          />
        ))}
        <p className="m-0 text-center text-caption text-ui-secondary">
          {t(isCurrentRates ? 'title_current' : 'title', {
            date: formatDate(rateData.date, 'LLLL yyyy'),
          })}
        </p>
        {isSaved && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => dispatch(core.fxRates.reset(month))}
          >
            {t('reset')}
          </Button>
        )}
        {canFetch && !isSaved && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => dispatch(loadFxRates(month))}
          >
            {t('download')}
          </Button>
        )}
      </div>
    </div>
  )
}

const rateFormat = new Intl.NumberFormat('en', {
  maximumFractionDigits: 3,
  useGrouping: false,
})

const FxRateInput: FC<{
  code: TFxCode
  mainCode: TFxCode
  quotePerUnit: number
  unitRatio: number
  onChange: (rate: number) => void
}> = props => {
  const { code, mainCode, quotePerUnit, unitRatio, onChange } = props
  const { t } = useTranslation('fxRates')

  const [isSwapped, swap] = useToggle()
  const [draft, setDraft] = useState<string | null>(null)

  const leftCode = isSwapped ? mainCode : code
  const rightCode = isSwapped ? code : mainCode
  const wholePrice = quotePerUnit * unitRatio
  const rate = isSwapped ? 1 / wholePrice : wholePrice
  const formattedRate = rateFormat.format(rate)
  const showUpperBound = draft === null && rate > 0 && formattedRate === '0'

  const onChg = useDebouncedCallback(
    (text: string) => {
      const value = Number(text.replace(',', '.'))
      if (!(value > 0) || value === rate) return
      const next = (isSwapped ? 1 / value : value) / unitRatio
      if (Number.isFinite(next) && next > 0) onChange(next)
    },
    [onChange, isSwapped, unitRatio, rate],
    400
  )

  return (
    <Input
      label={`${leftCode} / ${rightCode}`}
      size="sm"
      inputMode="decimal"
      value={draft ?? (showUpperBound ? '0.001' : formattedRate)}
      onValueChange={value => {
        setDraft(value)
        onChg(value)
      }}
      onBlur={() => {
        onChg.flush()
        setDraft(null)
      }}
      prefix={`1 ${leftCode} ${showUpperBound ? '<' : '='}`}
      end={
        <FieldAddon kind="action">
          <KitButton
            variant="ghost"
            size="sm"
            aria-label={t('swap', { from: rightCode, to: leftCode })}
            onClick={() => {
              onChg.flush()
              setDraft(null)
              swap()
            }}
          >
            {rightCode}
          </KitButton>
        </FieldAddon>
      }
    />
  )
}
