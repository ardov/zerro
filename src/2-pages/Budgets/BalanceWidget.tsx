import { Divider, Paper, Typography } from '@mui/material'
import Balancer from 'react-wrap-balancer'
import { useTranslation } from 'react-i18next'
import { keys } from '6-shared/helpers/keys'
import { TISOMonth } from '6-shared/types'
import { Total } from '6-shared/ui/Total'
import { DataLine } from '3-widgets/DataLine'

import { displayCurrency } from '5-entities/currency/displayCurrency'
import { balances } from '5-entities/envBalances'

export function BalanceWidget(props: { month: TISOMonth }) {
  const { t } = useTranslation('budgets')
  const totals = balances.useTotals()[props.month]
  const [currency, setDisplayCurrency] = displayCurrency.useDisplayCurrency()
  const toDisplay = displayCurrency.useToDisplay(props.month)
  const currencies = keys(totals.fundsEnd)
  const currCount = currencies.length

  const cycleForward = () => {
    const idx = currencies.findIndex(c => c === currency)
    const newIdx = (idx + 1) % currencies.length
    if (currencies[newIdx]) setDisplayCurrency(currencies[newIdx])
  }

  const currString =
    currCount > 1
      ? ` | ${t('currency', { ns: 'common', count: currCount })}`
      : ''
  const fundsEnd = toDisplay(totals.fundsEnd)
  const fundsChange = toDisplay(totals.fundsChange)
  const available = toDisplay(totals.available)
  const budgetedInFuture = toDisplay(totals.budgetedInFuture)
  const toBeBudgeted = toDisplay(totals.toBeBudgeted)
  const overspend = toDisplay(totals.overspend)

  const smartBudgetedInFuture = toBeBudgeted < 0 ? 0 : budgetedInFuture

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: 'background.default',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
      }}
    >
      <Total
        title={t('inBalance')}
        value={fundsEnd}
        currency={currency}
        onClick={cycleForward}
      />
      {/* <div>
        <Chip label={currString.trim()} />
        <Chip label={'5 счетов'} />
        <Chip label={formatMoney(fundsChange, displayCurrency)} />
      </div> */}
      <Divider />
      <DataLine
        name={t('inEnvelopes')}
        tooltip={t('inEnvelopesTooltip')}
        amount={available}
        currency={currency}
      />
      {!!smartBudgetedInFuture && (
        <DataLine
          name={t('budgetedInFuture')}
          tooltip={t('budgetedInFutureTooltip')}
          amount={smartBudgetedInFuture}
          currency={currency}
        />
      )}
      <DataLine
        name={t('toBeBudgeted')}
        tooltip={t('toBeBudgetedTooltip')}
        amount={toBeBudgeted}
        currency={currency}
      />
      <Divider />
      <Typography
        variant="body2"
        align="center"
        sx={{ color: 'text.secondary' }}
      >
        <Balancer>{getExplaining(fundsEnd, toBeBudgeted, overspend)}</Balancer>
      </Typography>
    </Paper>
  )

  function getExplaining(
    balance: number,
    toBeBudgeted: number,
    overspend: number
  ) {
    if (!!overspend) {
      return t('explainer.overspend')
    }
    if (toBeBudgeted > 0) {
      return t('explainer.hasFreeMoney')
    }
    if (balance < 0) {
      return t('explainer.negativeBalance')
    }
    if (toBeBudgeted === 0) {
      return t('explainer.zeroToBeBudgeted')
    }
    return t('explainer.budgetedMoreThanHave')
  }
}
