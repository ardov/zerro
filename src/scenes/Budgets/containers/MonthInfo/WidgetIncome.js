import React, { useContext, useState } from 'react'
import { useSelector } from 'react-redux'
import { format, endOfMonth } from 'date-fns'
import ru from 'date-fns/locale/ru'
import { MonthContext } from 'scenes/Budgets'
import { getTotalsByMonth } from '../../selectors/getTotalsByMonth'
import { getAmountsByTag } from '../../selectors/getAmountsByTag'
import { getUserCurrencyCode } from 'store/serverData'
import {
  Box,
  Typography,
  ButtonBase,
  withStyles,
  Collapse,
} from '@material-ui/core'
import Rhythm from 'components/Rhythm'
import { Tooltip } from 'components/Tooltip'
import { Line, Amount } from '../components'
import { getTagsTree } from 'store/localData/tags'
import TransactionsDrawer from 'components/TransactionsDrawer'

const Base = withStyles(theme => ({
  root: {
    display: 'block',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.default,
    padding: theme.spacing(2),
    textAlign: 'left',
  },
}))(ButtonBase)

const Dot = ({ color }) => (
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

export function WidgetIncome(props) {
  const month = useContext(MonthContext)
  const currency = useSelector(getUserCurrencyCode)
  const tags = useSelector(getTagsTree)
  const amounts = useSelector(getAmountsByTag)?.[month]
  const income = useSelector(getTotalsByMonth)?.[month]?.income
  const [opened, setOpened] = useState(false)
  const [selected, setSelected] = useState()
  const monthName = format(month, 'LLL', { locale: ru }).toLowerCase()

  const incomeData = tags
    .filter(tag => amounts[tag.id]?.totalIncome)
    .map(tag => ({
      id: tag.id,
      color: tag.colorGenerated,
      name: tag.title,
      amount: amounts[tag.id].totalIncome,
    }))
    .sort((a, b) => b.amount - a.amount)

  const toggleOpened = () => setOpened(opened => !opened)

  const filterConditions = {
    type: 'income',
    dateFrom: month,
    dateTo: endOfMonth(month),
    tags: [selected],
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
                      setSelected(tag.id)
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

function PercentBar({ data, ...rest }) {
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
