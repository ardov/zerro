import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { BarChart, Bar, XAxis, ResponsiveContainer } from 'recharts'
import { Box, Typography, useTheme } from '@material-ui/core'
import { Amount } from '../components'
import { formatDate } from 'helpers/format'
import { makeStyles } from '@material-ui/styles'
import { Tooltip } from 'components/Tooltip'
import Rhythm from 'components/Rhythm'
import {
  getAmountsByTag,
  getAmountsForTag,
} from 'scenes/Budgets/selectors/getAmountsByTag'
import getMonthDates from 'scenes/Budgets/selectors/getMonthDates'
import { getPopulatedTag } from 'store/localData/tags'

const useStyles = makeStyles(theme => ({
  base: {
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.default,
  },
}))

export function OutcomeWidget({ tagId, month, setMonth }) {
  const c = useStyles()
  const [selected, setSelected] = useState(month)

  const tag = useSelector(state => getPopulatedTag(state, tagId))
  const amounts = useSelector(getAmountsForTag)(month, tagId)
  const allAmounts = useSelector(getAmountsByTag)
  const dates = useSelector(getMonthDates)

  const isParent = !!amounts.children

  const dateRange = getDateRange(dates, 12, month)

  const data = dateRange.map(date => {
    let tagData = isParent
      ? allAmounts[date][tagId]
      : allAmounts[date][tag.parent].children[tagId]
    let outcome = tagData.totalOutcome ?? tagData.outcome
    let leftover = tagData.totalLeftover ?? tagData.leftover
    let budgeted = tagData.totalBudgeted ?? tagData.budgeted
    let available = tagData.totalAvailable ?? tagData.available
    let startingAmount = available + outcome

    // Handle positive outcome. It's possible with income transfers
    if (outcome < 0) {
      outcome = 0
      startingAmount = available
    }

    return { date, outcome, leftover, budgeted, available, startingAmount }
  })

  const selectedData = data.find(node => node.date === selected)
  useEffect(() => {
    setSelected(month)
  }, [month])

  const theme = useTheme()
  const outcomeColor = theme.palette.info.main
  const budgetLineColor = theme.palette.background.default
  const startingAmountColor = theme.palette.primary.main

  const StartingAmountTooltip = (
    <Rhythm gap={0.5}>
      <DataLine name="Бюджет в этом месяце" amount={selectedData?.budgeted} />
      <DataLine
        name="Остаток с прошлого месяца"
        amount={selectedData?.leftover}
      />
    </Rhythm>
  )

  const onMouseMove = e => {
    if (e?.activeLabel && e.activeLabel !== selected) {
      setSelected(e.activeLabel)
    }
  }
  const onClick = e => {
    if (e?.activeLabel && e.activeLabel !== month) {
      setMonth(e.activeLabel)
    }
  }

  return (
    <div className={c.base}>
      <Rhythm gap={0.5} pt={1} px={1}>
        <DataLine
          name="Расход"
          color={outcomeColor}
          amount={selectedData?.outcome}
        />
        <DataLine
          name={`Доступно на ${formatDate(selected, 'LLL')}`}
          color={startingAmountColor}
          colorOpacity={0.2}
          amount={selectedData?.startingAmount}
          tooltip={StartingAmountTooltip}
        />
      </Rhythm>

      <Box width="100%" height="160px">
        <ResponsiveContainer>
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
            barGap={0}
            onMouseMove={onMouseMove}
            onClick={onClick}
            onMouseLeave={() => setSelected(month)}
          >
            <Bar
              dataKey="startingAmount"
              fill={startingAmountColor}
              shape={<BudgetBar />}
            />
            <Bar
              dataKey="outcome"
              fill={outcomeColor}
              shape={<OutcomeBar current={selected} />}
            />
            <Bar
              dataKey="startingAmount"
              fill={budgetLineColor}
              shape={<BudgetLine />}
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tickFormatter={d => formatDate(d, 'LLL').slice(0, 3)}
              minTickGap={4}
            />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </div>
  )
}

function Dot({ color, colorOpacity = 1 }) {
  return (
    <span
      style={{
        width: 8,
        height: 8,
        background: color,
        display: 'inline-block',
        marginRight: 8,
        borderRadius: '50%',
        opacity: colorOpacity,
      }}
    />
  )
}

function DataLine({
  name,
  amount,
  currency,
  color,
  colorOpacity = 1,
  tooltip,
  ...rest
}) {
  return (
    <Box display="flex" flexDirection="row" {...rest}>
      <Box flexGrow="1" mr={1} minWidth={0} display="flex" alignItems="center">
        {!!color && <Dot color={color} colorOpacity={colorOpacity} />}
        {tooltip ? (
          <Tooltip title={tooltip}>
            <Typography noWrap variant="body2">
              {name}
            </Typography>
          </Tooltip>
        ) : (
          <Typography noWrap variant="body2">
            {name}
          </Typography>
        )}
      </Box>
      <Typography variant="body2">
        <Amount value={amount} currency={currency} />
      </Typography>
    </Box>
  )
}

const BudgetBar = ({ fill, x, y, width, height }) => {
  if (height <= 0) return null
  return (
    <rect
      rx={4}
      ry={4}
      x={x}
      y={y}
      width={width * 3}
      height={height}
      fill={fill}
      fillOpacity="0.2"
    />
  )
}

function OutcomeBar(props) {
  const { fill, x, y, width, height, date, current } = props
  return (
    <>
      {height > 0 && (
        <rect
          rx={4}
          ry={4}
          x={x - width}
          y={y}
          width={width * 3}
          height={height}
          fill={fill}
        />
      )}
      {date === current && (
        <circle
          cx={x - width + (width * 3) / 2}
          cy={y + height + 5}
          r="2"
          fill={fill}
        />
      )}
    </>
  )
}

const BudgetLine = props => {
  const { fill, x, y, width, outcome, startingAmount } = props
  if (startingAmount >= outcome || !outcome) return null
  return (
    <rect x={x - width * 2} y={y} width={width * 3} height={1} fill={fill} />
  )
}

function getDateRange(dates, range, targetMonth) {
  const idx = dates.findIndex(d => d === targetMonth)
  const arrayToTrim =
    idx === dates.length - 1 ? dates : dates.slice(0, dates.length - 1)
  if (idx === -1) return trimArray(arrayToTrim, range)
  return trimArray(arrayToTrim, range, idx)
}

/** Cuts out a range with target index in center */
function trimArray(arr = [], range = 1, targetIdx) {
  if (arr.length <= range) return arr
  if (targetIdx === undefined) return arr.slice(-range)

  let padLeft = Math.floor((range - 1) / 2)
  let padRight = range - 1 - padLeft
  let rangeStart = targetIdx - padLeft
  let rangeEnd = targetIdx + padRight

  if (rangeEnd >= arr.length) return arr.slice(-range)
  if (rangeStart <= 0) return arr.slice(0, range)
  return arr.slice(rangeStart, rangeEnd + 1)
}
