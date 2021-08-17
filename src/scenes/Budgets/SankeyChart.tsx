import React, { FC } from 'react'
import { useSelector } from 'react-redux'
import { getTotalsByMonth } from './selectors/getTotalsByMonth'
import { getAmountsByTag } from './selectors/getAmountsByTag'
import { getTagsTree } from 'store/localData/tags'
import { useMonth } from 'scenes/Budgets/pathHooks'
import {
  Sankey,
  Tooltip,
  Rectangle,
  Layer,
  ResponsiveContainer,
} from 'recharts'
import { formatMoney } from 'helpers/format'
import { useTheme } from '@material-ui/core'
import { round } from 'helpers/currencyHelpers'

export function SankeyChart() {
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
    value: round(
      monthTotals.funds - monthTotals.income + monthTotals.available
    ),
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
        margin={{ left: 16, right: 16, top: 16, bottom: 16 }}
        node={
          // Sankey chart inject needed props but types don't know about it
          // @ts-ignore
          <DemoSankeyNode
            fill={theme.palette.primary.main}
            containerWidth={600}
          />
        }
        nodeWidth={4}
        link={{ stroke: theme.palette.action.active }}
      >
        <Tooltip
          formatter={(v: number) => formatMoney(v)}
          contentStyle={{
            borderRadius: theme.shape.borderRadius,
            background: theme.palette.background.paper,
            color: theme.palette.text.primary,
            padding: theme.spacing(1),
            border: 0,
            boxShadow: theme.shadows[10],
          }}
          itemStyle={{
            color: theme.palette.text.primary,
          }}
        />
      </Sankey>
    </ResponsiveContainer>
  )
}

type SankeyNodeProps = {
  x: number
  y: number
  width: number
  height: number
  index: number
  fill: string
  payload: any
  containerWidth: number
}
const DemoSankeyNode: FC<SankeyNodeProps> = ({
  x,
  y,
  width,
  height,
  index,
  fill,
  payload,
  containerWidth,
}) => {
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
