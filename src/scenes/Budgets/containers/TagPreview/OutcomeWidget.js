import React, { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, ResponsiveContainer } from 'recharts'
import { Box, Typography, useTheme } from '@material-ui/core'
import { Amount } from '../components'
import { formatDate } from 'helpers/format'
import { makeStyles } from '@material-ui/styles'
import { Tooltip } from 'components/Tooltip'
import Rhythm from 'components/Rhythm'

const useStyles = makeStyles(theme => ({
  base: {
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.default,
  },
}))

const Dot = ({ color, colorOpacity = 1 }) => (
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
        <Dot color={color} colorOpacity={colorOpacity} />
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
      <rect
        rx={4}
        ry={4}
        x={x - width}
        y={y}
        width={width * 3}
        height={height}
        fill={fill}
      />
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
  const { fill, x, y, width, totalOutcome, startingAmount } = props
  if (startingAmount >= totalOutcome) return null
  return (
    <rect x={x - width * 2} y={y} width={width * 3} height={1} fill={fill} />
  )
}

export function OutcomeWidget({ data, isParent, month, ...rest }) {
  const c = useStyles()
  const [selected, setSelected] = useState(month)
  const selectedData = data.find(node => node.date === selected)

  useEffect(() => {
    setSelected(month)
  }, [month])

  const theme = useTheme()
  const outcomeColor = theme.palette.info.main
  const budgetLineColor = theme.palette.background.default
  const startingAmountColor = theme.palette.primary.main
  const outcomeKey = isParent ? 'totalOutcome' : 'outcome'
  const leftoverKey = isParent ? 'totalLeftover' : 'leftover'
  const budgetedKey = isParent ? 'totalBudgeted' : 'budgeted'
  const startingAmountKey = 'startingAmount'

  const StartingAmountTooltip = (
    <Rhythm gap={0.5}>
      <DataLine
        name="Бюджет в этом месяце"
        color={startingAmountColor}
        colorOpacity={0}
        amount={selectedData?.[budgetedKey]}
      />
      <DataLine
        name="Остаток с прошлого месяца"
        color={startingAmountColor}
        colorOpacity={0}
        amount={selectedData?.[leftoverKey]}
      />
    </Rhythm>
  )

  const onMouseMove = e => {
    if (e?.activeLabel && e.activeLabel !== selected) {
      setSelected(e.activeLabel)
    }
  }

  return (
    <div className={c.base}>
      <Rhythm gap={0.5} pt={1} px={1}>
        <DataLine
          name="Расход"
          color={outcomeColor}
          amount={selectedData?.[outcomeKey]}
        />
        <DataLine
          name="Доступно на месяц"
          color={startingAmountColor}
          colorOpacity={0.2}
          amount={selectedData?.[startingAmountKey]}
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
            onMouseLeave={() => setSelected(month)}
          >
            <Bar
              dataKey={startingAmountKey}
              fill={startingAmountColor}
              shape={<BudgetBar />}
            />
            <Bar
              dataKey={outcomeKey}
              fill={outcomeColor}
              shape={<OutcomeBar current={selected} />}
            />
            <Bar
              dataKey={startingAmountKey}
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
