import { core } from '@/zerro-core/redux'

import { useAppSelector } from '@/store'

import Balancer from 'react-wrap-balancer'
import { useTranslation } from 'react-i18next'
import { keys } from '@/6-shared/helpers/keys'
import type { TISOMonth } from '@/6-shared/types'
import { Total } from '@/6-shared/ui/Total'
import { DataLine } from '@/3-widgets/DataLine'

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
    <div className="flex flex-col gap-3 rounded-lg bg-background p-4">
      <Total
        title={t('inBalance')}
        value={fundsEnd}
        currency={currency}
        onClick={cycleForward}
      />
      <hr className="m-0 w-full border-0 border-t border-border" />
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
      <hr className="m-0 w-full border-0 border-t border-border" />
      <p className="m-0 text-center type-body-sm text-muted-foreground">
        <Balancer>{getExplaining(fundsEnd, toBeAssigned, overspend)}</Balancer>
      </p>
    </div>
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
