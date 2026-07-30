import { Divider, Paper, Typography } from '@mui/material'
import { core } from 'zerro-core/redux'

import { useAppSelector } from 'store'

import Balancer from 'react-wrap-balancer'
import { useTranslation } from 'react-i18next'
import { keys } from '6-shared/helpers/keys'
import type { TISOMonth } from '6-shared/types'
import { Total } from '6-shared/ui/Total'
import { DataLine } from '3-widgets/DataLine'

export function BalanceWidget(props: { month: TISOMonth }) {
  const { t } = useTranslation('budgets')
  const totals = useAppSelector(core.months.selectTotals)[props.month]
  const [currency, setDisplayCurrency] = core.currency.useDisplayCurrency()
  const toDisplay = core.currency.useToDisplay(props.month)
  const currencies = keys(totals.fundsEnd)

  const cycleForward = () => {
    const idx = currencies.findIndex(c => c === currency)
    const newIdx = (idx + 1) % currencies.length
    if (currencies[newIdx]) setDisplayCurrency(currencies[newIdx])
  }

  const fundsEnd = toDisplay(totals.fundsEnd)
  const available = toDisplay(totals.available)
  const assignedInFuture = toDisplay(totals.assignedInFuture)
  const toBeAssigned = toDisplay(totals.toBeAssigned)
  const overspend = toDisplay(totals.overspend)

  const smartAssignedInFuture = toBeAssigned < 0 ? 0 : assignedInFuture

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
      {!!smartAssignedInFuture && (
        <DataLine
          name={t('assignedInFuture')}
          tooltip={t('assignedInFutureTooltip')}
          amount={smartAssignedInFuture}
          currency={currency}
        />
      )}
      <DataLine
        name={t('toBeAssigned')}
        tooltip={t('toBeAssignedTooltip')}
        amount={toBeAssigned}
        currency={currency}
      />
      <Divider />
      <Typography
        variant="body2"
        align="center"
        sx={{ color: 'text.secondary' }}
      >
        <Balancer>{getExplaining(fundsEnd, toBeAssigned, overspend)}</Balancer>
      </Typography>
    </Paper>
  )

  function getExplaining(
    balance: number,
    toBeAssigned: number,
    overspend: number
  ) {
    if (overspend) {
      return t('explainer.overspend')
    }
    if (toBeAssigned > 0) {
      return t('explainer.hasFreeMoney')
    }
    if (balance < 0) {
      return t('explainer.negativeBalance')
    }
    if (toBeAssigned === 0) {
      return t('explainer.zeroToBeAssigned')
    }
    return t('explainer.assignedMoreThanHave')
  }
}
