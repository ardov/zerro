import React from 'react'
import { useSelector } from 'react-redux'
import { getTotalsByMonth } from './selectors/getTotalsByMonth'
import { getAmountsByTag } from './selectors/getAmountsByTag'
import { getTagsTree } from 'store/localData/tags'
import { useMonth } from 'scenes/Budgets/useMonth'
import {
  Sankey,
  Tooltip,
  Rectangle,
  Layer,
  ResponsiveContainer,
} from 'recharts'
import { formatMoney } from 'helpers/format'
import { useTheme } from '@material-ui/core'

export function SankeyChart(props) {
  const theme = useTheme()
  const [month] = useMonth()
  const tags = useSelector(getTagsTree)
  const amounts = useSelector(getAmountsByTag)?.[month]
  const monthTotals = useSelector(getTotalsByMonth)?.[month]

  let links = []
  let nodes = []

  nodes.push({ name: 'Бюджет' })
  const budgetId = nodes.length - 1

  nodes.push({ name: 'Остаток' })
  links.push({
    source: nodes.length - 1,
    target: budgetId,
    value: monthTotals.funds - monthTotals.income + monthTotals.available,
  })

  if (monthTotals.budgetedInFuture) {
    nodes.push({ name: 'Будущие бюджеты' })
    links.push({
      source: budgetId,
      target: nodes.length - 1,
      value: monthTotals.budgetedInFuture,
    })
  }

  tags.forEach(({ id, title }) => {
    if (!amounts[id]) return
    const { totalIncome, totalAvailable } = amounts[id]
    if (totalIncome) {
      nodes.push({ name: title })
      links.push({
        source: nodes.length - 1,
        target: budgetId,
        value: totalIncome,
      })
    }
    if (totalAvailable) {
      nodes.push({ name: title })
      links.push({
        source: budgetId,
        target: nodes.length - 1,
        value: totalAvailable,
      })
    }
  })

  const data = { nodes, links }

  return (
    <ResponsiveContainer minHeight={600}>
      <Sankey
        data={data}
        margin={{
          left: theme.spacing(2),
          right: theme.spacing(2),
          top: theme.spacing(2),
          bottom: theme.spacing(2),
        }}
        node={
          <DemoSankeyNode
            fill={theme.palette.primary.main}
            containerWidth={600}
          />
        }
        nodeWidth={4}
        link={{ stroke: theme.palette.action.active }}
      >
        <Tooltip />
      </Sankey>
    </ResponsiveContainer>
  )
}

function DemoSankeyNode({
  x,
  y,
  width,
  height,
  index,
  fill,
  payload,
  containerWidth,
}) {
  if (isNaN(y)) console.log('payload', payload)
  const isOut = x + width + 6 > containerWidth
  return (
    <Layer key={`CustomNode${index}`}>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        fillOpacity="1"
      />
      <text
        textAnchor={isOut ? 'end' : 'start'}
        x={isOut ? x - 6 : x + width + 6}
        y={y + height / 2}
        fontSize="12"
        fill={fill}
      >
        {payload.name} • {formatMoney(payload.value, null, 0)}
      </text>
    </Layer>
  )
}
