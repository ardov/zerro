import { ButtonBase } from '6-shared/ui/Button'
import { useCallback } from 'react'
import { core } from 'zerro-core/redux'

import { Collapse } from '6-shared/ui/Collapse'
import { useTranslation } from 'react-i18next'
import { useToggle } from '6-shared/hooks/useToggle'
import type { TISOMonth } from '6-shared/types'
import type { PercentBarItem } from '6-shared/ui/PercentBar'
import { PercentBar } from '6-shared/ui/PercentBar'

import { useAppSelector } from 'store'

import { DataLine } from '3-widgets/DataLine'
import { useEnvTransactionsDrawer } from '3-widgets/global/EnvTransactionsDrawer'

export function ActivityStats(props: { month: TISOMonth }) {
  const { month } = props
  const { t } = useTranslation('budgets', { keyPrefix: 'activityStats' })
  const activity = useAppSelector(core.activity.selectSorted)[month]
  const transactionDrawer = useEnvTransactionsDrawer()

  const showTransactions = useCallback(
    (id: TDataNode['id'], trMode: core.transactions.TrFilterMode) => {
      transactionDrawer.open({
        envelopeConditions: { id, month, mode: trMode, isExact: true },
      })
    },
    [month, transactionDrawer]
  )

  if (!activity) return null

  return (
    <>
      <StatWidget
        month={month}
        total={activity.incomesTotal}
        items={activity.incomes}
        name={t('incomes')}
        showBar
        action={showTransactions}
      />
      <StatWidget
        month={month}
        total={activity.outcomesTotal}
        items={activity.outcomes}
        name={t('outcomes')}
        showBar
        action={showTransactions}
      />
      <StatWidget
        month={month}
        total={activity.transfersTotal}
        items={activity.transfers}
        name={t('transfers')}
        action={showTransactions}
      />
      <StatWidget
        month={month}
        total={activity.debtsTotal}
        items={activity.debts}
        name={t('debts')}
        action={showTransactions}
      />
    </>
  )
}

type TDataNode = {
  id: core.activity.TSortedActivityNode['id']
  trMode: core.activity.TSortedActivityNode['trMode']
} & PercentBarItem

function StatWidget(props: {
  month: TISOMonth
  name: string
  showBar?: boolean
  total: core.activity.TActivitySummary
  items: core.activity.TSortedActivityNode[]
  action: (id: TDataNode['id'], trMode: core.transactions.TrFilterMode) => void
}) {
  const { month, total, items, name, showBar, action } = props
  const { t } = useTranslation('budgets', { keyPrefix: 'activityStats' })
  const [currency] = core.currency.useDisplayCurrency()
  const toDisplay = core.currency.useToDisplay(month)
  const envelopes = useAppSelector(core.envelopes.selectAll)
  const [opened, toggleOpened] = useToggle(false)

  const nodes: TDataNode[] = items.map(node => {
    const color =
      node.id === 'transferFees'
        ? '#808080'
        : envelopes[node.id]?.colorDisplay || '#ff0000'
    const name =
      node.id === 'transferFees'
        ? t('fxDifference')
        : envelopes[node.id]?.name || t('unknownCategory')

    if (node.id !== 'transferFees') {
      console.assert(
        envelopes[node.id] !== undefined,
        'envelopes[node.id] is undefined',
        node.id,
        envelopes
      )
    }

    return {
      id: node.id,
      trMode: node.trMode,
      amount: toDisplay(node.total.total),
      color,
      name,
    }
  })

  const totalAmount = toDisplay(total.total)

  if (!totalAmount) return null

  return (
    <>
      <ButtonBase
        onClick={toggleOpened}
        className="flex flex-col items-stretch rounded-lg bg-background p-4"
      >
        <DataLine name={name} amount={totalAmount} currency={currency} />

        {showBar && !!totalAmount && (
          <PercentBar data={nodes} className="mt-3" />
        )}

        <Collapse open={opened}>
          <div className="mt-4 flex flex-col gap-3">
            {nodes.map(point => (
              <DataLine
                key={point.id}
                name={point.name}
                amount={point.amount}
                color={point.color}
                currency={currency}
                onClick={e => {
                  e.stopPropagation()
                  action(point.id, point.trMode)
                }}
              />
            ))}
          </div>
        </Collapse>
      </ButtonBase>
    </>
  )
}
