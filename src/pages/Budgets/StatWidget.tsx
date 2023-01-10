import { FC } from 'react'
import { Box, BoxProps, ButtonBase, Collapse, Stack } from '@mui/material'
import { keys } from '@shared/helpers/keys'
import { add } from '@shared/helpers/money'
import { useToggle } from '@shared/hooks/useToggle'
import { TEnvelopeId, TISOMonth } from '@shared/types'
import { DataLine } from '@components/DataLine'
import { Tooltip } from '@shared/ui/Tooltip'

import { displayCurrency } from '@entities/currency/displayCurrency'
import { balances } from '@entities/envBalances'
import { envelopeModel } from '@entities/envelope'

import { trMode, useTrDrawer } from './TransactionsDrawer'

type DataPoint = {
  id: TEnvelopeId | 'transferFees'
  mode: trMode
  color: string
  amount: number
  keepIncome: boolean
  name: string
}

export function StatWidget(props: {
  month: TISOMonth
  mode: 'income' | 'outcome'
}) {
  const { month, mode } = props
  const { setDrawer } = useTrDrawer()
  const [currency] = displayCurrency.useDisplayCurrency()
  const [opened, toggleOpened] = useToggle(false)

  const points = useDataPoints(month)

  const data = points.filter(
    point =>
      (point.amount > 0 && mode === 'income') ||
      (point.amount < 0 && mode === 'outcome')
  )

  const totalAmount = data.reduce((sum, point) => add(sum, point.amount), 0)

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
        {/* <Collapse in={opened} unmountOnExit>
          <ChangesChart mode={props.mode} />
          <Box height={12} />
        </Collapse> */}

        <DataLine
          name={mode === 'income' ? 'Доходы' : 'Расходы'}
          amount={totalAmount}
          currency={currency}
        />

        {!!totalAmount && <PercentBar data={data} mt={1.5} />}
        <Collapse in={opened} unmountOnExit>
          <Stack gap={1.5} mt={2}>
            {data.map(point => (
              <DataLine
                key={point.id}
                name={point.name}
                amount={point.amount}
                color={point.color}
                currency={currency}
                onClick={e => {
                  e.stopPropagation()
                  setDrawer(point.id, {
                    mode: point.mode,
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

function useDataPoints(month: TISOMonth) {
  const toDisplay = displayCurrency.useToDisplay(month)
  const activity = balances.useActivity()[month]
  const envelopes = envelopeModel.useEnvelopes()
  const data: DataPoint[] = []

  if (!activity) return data

  // Add env activity
  const envActivity = activity?.envActivity?.byEnv || {}
  keys(envActivity).forEach(id => {
    data.push({
      id,
      mode: trMode.Envelope,
      amount: toDisplay(envActivity[id].total),
      color: envelopes[id].color || envelopes[id].colorGenerated,
      keepIncome: envelopes[id].keepIncome,
      name: envelopes[id].name,
    })
  })

  // Add general income
  const generalIncome = activity?.generalIncome?.byEnv || {}
  keys(generalIncome).forEach(id => {
    data.push({
      id,
      mode: trMode.GeneralIncome,
      amount: toDisplay(generalIncome[id].total),
      color: envelopes[id].color || envelopes[id].colorGenerated,
      keepIncome: envelopes[id].keepIncome,
      name: envelopes[id].name,
    })
  })

  // Add transfer fees
  data.push({
    id: 'transferFees',
    mode: trMode.TransferFees,
    amount: toDisplay(activity?.transferFees?.total || {}),
    color: '#808080',
    keepIncome: false,
    name: 'Переводы внутри',
  })

  return data
}
