import { FC, useCallback } from 'react'
import { ButtonBase, Collapse, Stack } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useToggle } from '6-shared/hooks/useToggle'
import { TISOMonth } from '6-shared/types'
import { PercentBar, PercentBarItem } from '6-shared/ui/PercentBar'

import { displayCurrency } from '5-entities/currency/displayCurrency'
import {
  balances,
  EnvActivity,
  TrFilterMode,
  TSortedActivityNode,
} from '5-entities/envBalances'
import { envelopeModel } from '5-entities/envelope'
import { DataLine } from '3-widgets/DataLine'
import { useEnvTransactionsDrawer } from '3-widgets/global/EnvTransactionsDrawer'

export function ActivityStats(props: { month: TISOMonth }) {
  const { month } = props
  const { t } = useTranslation('budgets', { keyPrefix: 'activityStats' })
  const activity = balances.useSortedActivity()[month]
  const transactionDrawer = useEnvTransactionsDrawer()

  const showTransactions = useCallback(
    (id: TDataNode['id'], trMode: TrFilterMode) => {
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
  id: TSortedActivityNode['id']
  trMode: TSortedActivityNode['trMode']
} & PercentBarItem

function StatWidget(props: {
  month: TISOMonth
  name: string
  showBar?: boolean
  total: EnvActivity
  items: TSortedActivityNode[]
  action: (id: TDataNode['id'], trMode: TrFilterMode) => void
}) {
  const { month, total, items, name, showBar, action } = props
  const { t } = useTranslation('budgets', { keyPrefix: 'activityStats' })
  const [currency] = displayCurrency.useDisplayCurrency()
  const toDisplay = displayCurrency.useToDisplay(month)
  const envelopes = envelopeModel.useEnvelopes()
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
        sx={{
          bgcolor: 'background.default',
          borderRadius: 1,
          p: 2,
          display: 'flex',
          alignItems: 'stretch',
          flexDirection: 'column',
        }}
      >
        {/* <Collapse in={opened} unmountOnExit>
          <ChangesChart mode={props.mode} />
          <Box height={12} />
        </Collapse> */}

        <DataLine name={name} amount={totalAmount} currency={currency} />

        {showBar && !!totalAmount && <PercentBar data={nodes} mt={1.5} />}

        <Collapse in={opened} unmountOnExit>
          <Stack
            sx={{
              gap: 1.5,
              mt: 2,
            }}
          >
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
          </Stack>
        </Collapse>
      </ButtonBase>
    </>
  )
}

// —————————————————————————————————————————————————————————————————————————————
// —————————————————————————————————————————————————————————————————————————————

const PercentBar: FC<BoxProps & { data: TDataNode[] }> = props => {
  const { data, ...rest } = props
  const sum = data.reduce((sum, n) => sum + Math.abs(n.amount), 0)
  return (
    <Box
      {...rest}
      sx={[
        {
          display: 'flex',
          width: '100%',
          height: '8px',
          borderRadius: '6px',
          overflow: 'hidden',
        },
        ...(Array.isArray(rest.sx) ? rest.sx : [rest.sx]),
      ]}
    >
      {data.map((bar, i) => (
        <Tooltip title={bar.name} key={bar.id}>
          <Box
            sx={{
              flexBasis: (Math.abs(bar.amount) * 100) / sum + '%',
              minWidth: '2px',
              pl: i === 0 ? 0 : '1px',
            }}
          >
            <Box
              sx={{
                bgcolor: bar.color,
                height: '100%',
              }}
            />
          </Box>
        </Tooltip>
      ))}
    </Box>
  )
}
