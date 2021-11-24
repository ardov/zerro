import React, { FC, useState } from 'react'
import { useSelector } from 'react-redux'
import { endOfMonth } from 'date-fns'
import { getAmountsByTag, getTotalsByMonth } from '../../selectors'
import { getUserCurrencyCode } from 'store/data/instruments'
import { Box, Typography, ButtonBase, Collapse, BoxProps } from '@mui/material'
import { withStyles } from '@mui/styles'
import Rhythm from 'components/Rhythm'
import { Tooltip } from 'components/Tooltip'
import { Line } from '../components'
import { Amount } from 'components/Amount'
import { getTagsTree } from 'store/data/tags'
import { TransactionsDrawer } from 'components/TransactionsDrawer'
import { useMonth } from 'scenes/Budgets/pathHooks'
import { formatDate } from 'helpers/format'
import { FilterConditions } from 'store/data/transactions/filtering'
import { useToggle } from 'helpers/useToggle'

type IncomeDataPoint = {
  id: string
  color: string
  name: string
  amount: number
  filter: string[]
}

const Dot: FC<{ color: string }> = ({ color }) => (
  <span
    style={{
      width: 12,
      height: 12,
      background: color,
      display: 'inline-block',
      marginRight: 8,
      borderRadius: '50%',
    }}
  />
)

export function WidgetIncome() {
  const [month] = useMonth()
  const currency = useSelector(getUserCurrencyCode)
  const tags = useSelector(getTagsTree)
  const amounts = useSelector(getAmountsByTag)?.[month]
  const income = useSelector(getTotalsByMonth)?.[month]?.income
  const [opened, toggleOpened] = useToggle(false)
  const [selected, setSelected] = useState<string[]>()
  const monthName = formatDate(month, 'LLL').toLowerCase()

  const incomeData: IncomeDataPoint[] = tags
    .filter(tag => amounts[tag.id]?.totalIncome)
    .map(tag => ({
      id: tag.id,
      color: tag.colorGenerated,
      name: tag.title,
      amount: amounts[tag.id].totalIncome,
      filter: [tag.id, ...tag.children.map(child => child.id)],
    }))
    .sort((a, b) => b.amount - a.amount)

  const filterConditions: FilterConditions = {
    type: 'income',
    dateFrom: month,
    dateTo: endOfMonth(month),
    mainTags: selected,
  }

  return (
    <>
      <Base onClick={toggleOpened}>
        <Box display="flex" width="100%" justifyContent="space-between">
          <Typography>Доход за {monthName}</Typography>
          <Typography>
            <Amount value={income} currency={currency} />
          </Typography>
        </Box>

        {!!income && (
          <>
            <PercentBar data={incomeData} mt={1} />

            <Collapse in={opened}>
              <Rhythm gap={1.5} pt={2} width="100%">
                {incomeData.map(tag => (
                  <Line
                    key={tag.id}
                    onClick={e => {
                      e.stopPropagation()
                      e.preventDefault()
                      setSelected(tag.filter)
                    }}
                    name={
                      <>
                        <Dot color={tag.color} />
                        {tag.name}
                      </>
                    }
                    amount={tag.amount}
                    currency={currency}
                  />
                ))}
              </Rhythm>
            </Collapse>
          </>
        )}
      </Base>

      <TransactionsDrawer
        filterConditions={filterConditions}
        open={!!selected || selected === null}
        onClose={() => setSelected(undefined)}
      />
    </>
  )
}

const Base = withStyles(theme => ({
  root: {
    display: 'block',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.default,
    padding: theme.spacing(2),
    textAlign: 'left',
  },
}))(ButtonBase)

const PercentBar: FC<BoxProps & { data: IncomeDataPoint[] }> = props => {
  const { data, ...rest } = props
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
            flexBasis={bar.amount + '%'}
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
