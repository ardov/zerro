import { FC, useCallback } from 'react'
import { Box, BoxProps, ButtonBase, Collapse, Stack } from '@mui/material'
import { useToggle } from '@shared/hooks/useToggle'
import { TISOMonth } from '@shared/types'
import { DataLine } from '@components/DataLine'
import { Tooltip } from '@shared/ui/Tooltip'

import { displayCurrency } from '@entities/currency/displayCurrency'
import { EnvActivity } from '@entities/envBalances'
import { envelopeModel, TEnvelopeId } from '@entities/envelope'
import { trMode, useTrDrawer } from '@pages/Budgets/TransactionsDrawer'
import { TInfoNode, useActivityStatsModel } from './getActivity'

export function ActivityStats(props: { month: TISOMonth }) {
  const { month } = props
  const activity = useActivityStatsModel(month)
  const { setDrawer } = useTrDrawer()
  console.log({ activity })
  const showIncomes = useCallback(
    (id: TDataNode['id']) => {
      setDrawer(id, { mode: trMode.GeneralIncome, isExact: true })
    },
    [setDrawer]
  )
  const showOutcomes = useCallback(
    (id: TDataNode['id']) => {
      setDrawer(id, { mode: trMode.GeneralIncome, isExact: true })
    },
    [setDrawer]
  )

  return (
    <>
      <StatWidget
        month={month}
        total={activity.incomesTotal}
        items={activity.incomes}
        name="Доходы"
        showBar
        action={id => {
          setDrawer(id, { mode: trMode.All, isExact: true })
        }}
      />
      <StatWidget
        month={month}
        total={activity.outcomesTotal}
        items={activity.outcomes}
        name="Расходы"
        showBar
        action={id => {
          setDrawer(id, { mode: trMode.All, isExact: true })
        }}
      />
      <StatWidget
        month={month}
        total={activity.transfersTotal}
        items={activity.transfers}
        name="Переводы"
        action={id => {
          setDrawer(id, { mode: trMode.All, isExact: true })
        }}
      />
      <StatWidget
        month={month}
        total={activity.debtsTotal}
        items={activity.debts}
        name="Долги"
        action={id => {
          setDrawer(id, { mode: trMode.All, isExact: true })
        }}
      />
    </>
  )
}

type TDataNode = {
  id: TEnvelopeId | 'transferFees'
  color: string
  amount: number
  keepIncome: boolean
  name: string
}

function StatWidget(props: {
  month: TISOMonth
  name: string
  showBar?: boolean
  total: EnvActivity
  items: TInfoNode[]
  action: (id: TDataNode['id']) => void
}) {
  const { month, total, items, name, showBar, action } = props
  const [currency] = displayCurrency.useDisplayCurrency()
  const toDisplay = displayCurrency.useToDisplay(month)
  const envelopes = envelopeModel.useEnvelopes()
  const [opened, toggleOpened] = useToggle(false)

  const nodes: TDataNode[] = items.map(node => {
    return {
      id: node.id,
      color:
        node.id === 'transferFees'
          ? '#808080'
          : envelopes[node.id].colorGenerated,
      amount: toDisplay(node.total.total),
      keepIncome: !!node.keepIncome,
      name:
        node.id === 'transferFees'
          ? 'Курсовая разница'
          : envelopes[node.id].name,
    }
  })

  const totalAmount = toDisplay(total.total)

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
          <Stack gap={1.5} mt={2}>
            {nodes.map(point => (
              <DataLine
                key={point.id}
                name={point.name}
                amount={point.amount}
                color={point.color}
                currency={currency}
                onClick={e => {
                  e.stopPropagation()
                  action(point.id)
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
      display="flex"
      width="100%"
      height="8px"
      borderRadius="6px"
      overflow="hidden"
      {...rest}
    >
      {data.map((bar, i) => (
        <Tooltip title={bar.name} key={bar.id}>
          <Box
            flexBasis={(Math.abs(bar.amount) * 100) / sum + '%'}
            minWidth="2px"
            pl={i === 0 ? 0 : '1px'}
          >
            <Box bgcolor={bar.color} height="100%" />
          </Box>
        </Tooltip>
      ))}
    </Box>
  )
}
