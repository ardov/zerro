import { getMonthTotals } from '@entities/envelopeData'
import { useDisplayCurrency } from '@entities/instrument/hooks'
import { Divider, Paper } from '@mui/material'
import { convertFx } from '@shared/helpers/money'
import { TFxAmount, TISOMonth } from '@shared/types'
import { DataLine } from '@shared/ui/DataLine'
import { useAppSelector } from '@store/index'
import { FC } from 'react'

const useBudgetInfoModel = (month: TISOMonth) => {
  const totals = useAppSelector(getMonthTotals)[month]
  const { currency, rates, envelopes, fundsEnd } = totals

  return {
    fundsEnd: totals.fundsEnd,
    fundsStart: totals.fundsStart,
  }
}

export const BalanceInfo: FC<{ month: TISOMonth }> = props => {
  const totals = useAppSelector(getMonthTotals)[props.month]
  const displayCurrency = useDisplayCurrency()
  const { rates } = totals
  const toDisplay = (a: TFxAmount) => convertFx(a, displayCurrency, rates)

  return (
    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
      <DataLine
        name="Всего в бюджете"
        amount={toDisplay(totals.fundsEnd)}
        currency={displayCurrency}
      />
      <DataLine
        name="За месяц"
        amount={toDisplay(totals.fundsChange)}
        currency={displayCurrency}
        sign
      />

      <Divider />

      <DataLine
        name="Распределено"
        amount={toDisplay(totals.available)}
        currency={displayCurrency}
      />
      <DataLine
        name="Распределено в будущем"
        amount={toDisplay(totals.budgetedInFuture)}
        currency={displayCurrency}
      />
      <DataLine
        name="Свободно"
        amount={toDisplay(totals.toBeBudgetedFx)}
        currency={displayCurrency}
      />
    </Paper>
  )
}
