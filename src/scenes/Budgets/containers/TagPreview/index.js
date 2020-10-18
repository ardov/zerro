import React from 'react'
import { useSelector } from 'react-redux'
import {
  ComposedChart,
  Bar,
  Area,
  Line,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
} from 'recharts'
import getMonthDates from 'scenes/Budgets/selectors/getMonthDates'
import EmojiIcon from 'components/EmojiIcon'
import { Box, Typography, IconButton, useTheme, Paper } from '@material-ui/core'
import { Tooltip } from 'components/Tooltip'
import CloseIcon from '@material-ui/icons/Close'
import { getPopulatedTag } from 'store/localData/tags'
import { Total, Line as TextLine, Amount } from '../components'
import {
  getAmountsForTag,
  getAmountsByTag,
} from 'scenes/Budgets/selectors/getAmountsByTag'
import Rhythm from 'components/Rhythm'
import { makeStyles } from '@material-ui/styles'
import { useMonth } from 'scenes/Budgets/useMonth'
import { LinkedAccs } from './LinkedAccs'
import { formatDate } from 'helpers/format'

const useStyles = makeStyles(theme => ({
  base: {
    display: 'block',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.default,
    // padding: theme.spacing(2),
    textAlign: 'left',
  },
}))

export function TagPreview({ onClose, id }) {
  const c = useStyles()
  const [month] = useMonth()
  const tag = useSelector(state => getPopulatedTag(state, id))
  const amounts = useSelector(getAmountsForTag)(month, id)
  const allAmounts = useSelector(getAmountsByTag)
  const dates = useSelector(getMonthDates)
  if (!amounts) return null
  const isParent = !!amounts.children

  const tagHistory = dates
    .map(month => {
      let dataPoint = tag.parent
        ? allAmounts[month][tag.parent].children[id]
        : allAmounts[month][id]
      let startingAmount = isParent
        ? dataPoint.totalAvailable + dataPoint.totalOutcome
        : dataPoint.available + dataPoint.outcome
      return { ...dataPoint, date: month, startingAmount }
    })
    .splice(-12)

  const {
    // available,
    // totalAvailable,
    leftover,
    totalLeftover,
    budgeted,
    totalBudgeted,
    // children,
    // childrenAvailable,
    // childrenBudgeted,
    // childrenIncome,
    // childrenLeftover,
    // childrenOutcome,
    // childrenOverspent,
    // income,
    outcome,
    // tagOutcome,
    // totalIncome,
    totalOutcome,
    // totalOverspent,
    transferOutcome,
  } = amounts

  const available = amounts.totalAvailable || amounts.available

  return (
    <Box>
      <Box py={1} px={3} display="flex" alignItems="center">
        <Box flexGrow={1} display="flex" minWidth={0} alignItems="center">
          <EmojiIcon size="m" symbol={tag.symbol} mr={2} flexShrink={0} />
          <Typography variant="h6" component="span" noWrap>
            {tag.name}
          </Typography>
        </Box>

        <Tooltip title="Закрыть">
          <IconButton edge="end" onClick={onClose} children={<CloseIcon />} />
        </Tooltip>
      </Box>

      <Box
        px={3}
        display="flex"
        flexDirection="row"
        justifyContent="space-between"
      >
        <Total name="Доступно" value={available} align="left" />
        <Total
          name="Расход"
          value={isParent ? totalOutcome : outcome}
          align="left"
        />
      </Box>
      <Rhythm gap={1} p={3}>
        <div className={c.base} style={{ width: '100%', height: 100 }}>
          <ResponsiveContainer>
            <BudgetChart data={tagHistory} isParent={isParent} />
          </ResponsiveContainer>
        </div>

        <div className={c.base} style={{ width: '100%', height: 100 }}>
          <ResponsiveContainer>
            <OutcomeChart data={tagHistory} isParent={isParent} />
          </ResponsiveContainer>
        </div>

        <div className={c.base} style={{ width: '100%', height: 100 }}>
          <ResponsiveContainer>
            <AvailableChart data={tagHistory} isParent={isParent} />
          </ResponsiveContainer>
        </div>

        <TextLine
          name="Остаток с прошлого месяца"
          amount={isParent ? totalLeftover : leftover}
        />
        <TextLine name="Бюджет" amount={isParent ? totalBudgeted : budgeted} />
        <TextLine name="Расход" amount={isParent ? totalOutcome : outcome} />
        <TextLine name="— Переводы" amount={transferOutcome} />

        <LinkedAccs id={id} />
      </Rhythm>
    </Box>
  )
}

const Dot = ({ color }) => (
  <span
    style={{
      width: 8,
      height: 8,
      background: color,
      display: 'inline-block',
      marginRight: 8,
      borderRadius: '50%',
    }}
  />
)

function DataLine({ name, amount, currency, color, ...rest }) {
  return (
    <Box display="flex" flexDirection="row" {...rest}>
      <Box flexGrow="1" mr={1} minWidth={0}>
        <Typography noWrap variant="body2">
          <Dot color={color} /> {name}
        </Typography>
      </Box>
      <Typography variant="body2">
        <Amount value={amount} currency={currency} />
      </Typography>
    </Box>
  )
}

function OutcomeChart({ data, isParent, ...rest }) {
  const theme = useTheme()
  const outcomeColor = theme.palette.error.main
  const outcomeKey = isParent ? 'totalOutcome' : 'outcome'

  return (
    <ComposedChart
      data={data}
      barGap={1}
      margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
      {...rest}
    >
      <ChartTooltip
        content={data => {
          const payload = data?.payload?.[0]?.payload
          if (!payload) return null
          return (
            <Paper>
              <Box p={1}>
                <Box mb={1}>{formatDate(payload.date, 'LLLL')}</Box>
                <DataLine
                  name="Расход"
                  color={outcomeColor}
                  amount={payload[outcomeKey]}
                />
              </Box>
            </Paper>
          )
        }}
      />
      <Bar dataKey={outcomeKey} fill={outcomeColor} radius={[2, 2, 0, 0]} />
    </ComposedChart>
  )
}

function AvailableChart({ data, isParent, ...rest }) {
  const theme = useTheme()

  const availableColor = theme.palette.info.main
  const availableKey = isParent ? 'totalAvailable' : 'available'

  return (
    <ComposedChart
      data={data}
      barGap={1}
      margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
      {...rest}
    >
      <ChartTooltip
        content={data => {
          const payload = data?.payload?.[0]?.payload
          if (!payload) return null
          return (
            <Paper>
              <Box p={1}>
                <Box mb={1}>{formatDate(payload.date, 'LLLL')}</Box>
                <DataLine
                  name="Доступно"
                  color={availableColor}
                  amount={payload[availableKey]}
                />
              </Box>
            </Paper>
          )
        }}
      />
      <Line
        type="step"
        strokeWidth={2}
        dot={false}
        dataKey={availableKey}
        stroke={availableColor}
      />
    </ComposedChart>
  )
}

function BudgetChart({ data, isParent, ...rest }) {
  const theme = useTheme()
  const budgetedColor = theme.palette.primary.main
  const budgetedKey = isParent ? 'totalBudgeted' : 'budgeted'

  return (
    <ComposedChart
      data={data}
      barGap={1}
      margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
      {...rest}
    >
      <ChartTooltip
        content={data => {
          const payload = data?.payload?.[0]?.payload
          if (!payload) return null
          return (
            <Paper>
              <Box p={1}>
                <Box mb={1}>{formatDate(payload.date, 'LLLL')}</Box>
                <DataLine
                  name="Бюджет"
                  color={budgetedColor}
                  amount={payload[budgetedKey]}
                />
              </Box>
            </Paper>
          )
        }}
      />

      <Bar dataKey={budgetedKey} fill={budgetedColor} radius={[2, 2, 0, 0]} />
    </ComposedChart>
  )
}
