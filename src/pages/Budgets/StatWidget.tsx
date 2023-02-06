import { FC } from 'react'
import { Box, BoxProps, ButtonBase, Collapse, Stack } from '@mui/material'
import { keys } from '@shared/helpers/keys'
import { add } from '@shared/helpers/money'
import { useToggle } from '@shared/hooks/useToggle'
import { TISOMonth } from '@shared/types'
import { DataLine } from '@components/DataLine'
import { Tooltip } from '@shared/ui/Tooltip'

import { displayCurrency } from '@entities/currency/displayCurrency'
import { balances } from '@entities/envBalances'
import {
  envelopeModel,
  EnvType,
  TEnvelope,
  TEnvelopeId,
} from '@entities/envelope'

import { trMode, useTrDrawer } from './TransactionsDrawer'

type TMode = 'income' | 'outcome' | 'transfer' | 'debt'

type TDataNode = {
  id: TEnvelopeId | 'transferFees'
  mode: TMode
  trMode: trMode
  color: string
  amount: number
  keepIncome: boolean
  name: string
}

export function StatWidget(props: { month: TISOMonth; mode: TMode }) {
  const { month, mode } = props
  const { setDrawer } = useTrDrawer()
  const [currency] = displayCurrency.useDisplayCurrency()
  const [opened, toggleOpened] = useToggle(false)

  const nodes = useDataPoints(month)
    .filter(point => point.mode === mode)
    .filter(point => point.amount !== 0)
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))

  const totalAmount = nodes.reduce((sum, point) => add(sum, point.amount), 0)

  if (!nodes.length) return null

  const name = {
    income: 'Доходы',
    outcome: 'Расходы',
    transfer: 'Переводы',
    debt: 'Долги',
  }[mode]

  const showBar = (mode === 'income' || mode === 'outcome') && totalAmount !== 0

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

        {showBar && <PercentBar data={nodes} mt={1.5} />}

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
                  console.log(point)

                  setDrawer(point.id, {
                    mode: point.trMode,
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

const PercentBar: FC<BoxProps & { data: TDataNode[] }> = props => {
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
  const data: TDataNode[] = []

  if (!activity) return data

  function getMode(envType: TEnvelope['type'], amount: number): TMode {
    if (envType === EnvType.Account) return 'transfer'
    if (envType === EnvType.Merchant || envType === EnvType.Payee) return 'debt'
    return amount > 0 ? 'income' : 'outcome'
  }

  // Add env activity
  const envActivity = activity?.envActivity?.byEnv || {}
  keys(envActivity).forEach(id => {
    const amount = toDisplay(envActivity[id].total)
    data.push({
      id,
      mode: getMode(envelopes[id].type, amount),
      trMode: trMode.Envelope,
      amount,
      color: envelopes[id].color || envelopes[id].colorGenerated,
      keepIncome: envelopes[id].keepIncome,
      name: envelopes[id].name,
    })
  })

  // Add general income
  const generalIncome = activity?.generalIncome?.byEnv || {}
  keys(generalIncome).forEach(id => {
    const amount = toDisplay(generalIncome[id].total)
    data.push({
      id,
      mode: getMode(envelopes[id].type, amount),
      trMode: trMode.GeneralIncome,
      amount,
      color: envelopes[id].color || envelopes[id].colorGenerated,
      keepIncome: envelopes[id].keepIncome,
      name: envelopes[id].name,
    })
  })

  // Add transfer fees
  data.push({
    id: 'transferFees',
    mode: 'transfer',
    trMode: trMode.All,
    amount: toDisplay(activity?.transferFees?.total || {}),
    color: '#808080',
    keepIncome: false,
    name: 'Переводы внутри',
  })

  return data
}
