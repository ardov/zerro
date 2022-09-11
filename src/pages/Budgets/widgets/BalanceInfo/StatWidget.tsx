import { FC } from 'react'
import { Box, BoxProps, ButtonBase, Collapse, Stack } from '@mui/material'
import { keys } from '@shared/helpers/keys'
import { convertFx } from '@shared/helpers/money'
import { useToggle } from '@shared/hooks/useToggle'
import { TEnvelopeId, TFxAmount, TISOMonth } from '@shared/types'
import { DataLine } from '@shared/ui/DataLine'
import { Tooltip } from '@shared/ui/Tooltip'
import { useAppSelector } from '@store/index'
import { getMonthTotals, getTotalChanges } from '@entities/envelopeData'
import { useDisplayCurrency } from '@entities/instrument/hooks'
import { trMode, useTrDrawer } from '../TransactionsDrawer'

type DataPoint = {
  id: TEnvelopeId
  color: string
  amount: number
  keepIncome: boolean
  name: string
}

export function StatWidget(props: {
  month: TISOMonth
  mode: 'income' | 'outcome'
}) {
  const { setDrawer } = useTrDrawer()
  const showIncome = props.mode === 'income'
  const displayCurrency = useDisplayCurrency()
  const totals = useAppSelector(getMonthTotals)[props.month]
  const { rates } = totals
  const changes = useAppSelector(getTotalChanges)[props.month]
  const [opened, toggleOpened] = useToggle(false)
  const toDisplay = (a: TFxAmount) => convertFx(a, displayCurrency, rates)

  const totalAmount = toDisplay(
    showIncome ? changes.sum.totalIncome : changes.sum.totalOutcome
  )
  const data: DataPoint[] = []
  keys(changes.byEnvelope).forEach(id => {
    const amount = toDisplay(
      showIncome
        ? changes.byEnvelope[id].totalIncome
        : changes.byEnvelope[id].totalOutcome
    )
    if (!amount) return
    data.push({
      id,
      amount,
      color: totals.envelopes[id].color || totals.envelopes[id].colorGenerated,
      keepIncome: totals.envelopes[id].keepIncome,
      name: totals.envelopes[id].name,
    })
  })
  data.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))

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
        <DataLine
          name={showIncome ? 'Доходы' : 'Расходы'}
          amount={totalAmount}
          currency={displayCurrency}
        />

        <PercentBar data={data} mt={1.5} />
        <Collapse in={opened}>
          <Stack gap={1.5} mt={2}>
            {data.map(envelope => (
              <DataLine
                key={envelope.id}
                name={envelope.name}
                amount={envelope.amount}
                color={envelope.color}
                currency={displayCurrency}
                onClick={e => {
                  e.stopPropagation()
                  setDrawer(envelope.id, {
                    mode: showIncome ? trMode.income : trMode.outcome,
                    isExact: true,
                  })
                }}
              />
            ))}
          </Stack>
        </Collapse>
      </ButtonBase>
    </>
  )
}

const PercentBar: FC<BoxProps & { data: DataPoint[] }> = props => {
  const { data, ...rest } = props
  const sum = data.reduce((sum, n) => sum + n.amount, 0)
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
            flexBasis={(bar.amount * 100) / sum + '%'}
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
