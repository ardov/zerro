import React, { useCallback } from 'react'
import { useAppSelector } from 'store'
import { getAmountsByTag, getTotalsByMonth } from '../selectors'
import { getTagsTree } from 'store/data/tags'
import { useMonth } from 'scenes/Budgets/pathHooks'
import { Tooltip, Treemap, ResponsiveContainer } from 'recharts'
import { formatMoney } from 'helpers/format'
import { Card, Typography, useTheme } from '@mui/material'
import { Amount } from 'components/Amount'
import { getMostContrast } from 'helpers/color'

type TTreeNode = {
  id: string
  name: string
  symbol?: string
  amount?: number
  color?: string
  children?: TTreeNode[]
}

type TagMapChartProps = {
  onSelect?: (id: string) => void
}

export function TagMapChart(props: TagMapChartProps) {
  const { onSelect } = props
  const theme = useTheme()
  const [month] = useMonth()
  const tags = useAppSelector(getTagsTree)
  const amounts = useAppSelector(getAmountsByTag)?.[month]
  const monthTotals = useAppSelector(getTotalsByMonth)?.[month]

  const { toBeBudgeted, budgetedInFuture } = monthTotals

  function getData(): TTreeNode[] {
    let data: TTreeNode[] = []
    tags.forEach(tag => {
      const { id, uniqueName, symbol, children, colorHEX, colorGenerated } = tag
      const { totalAvailable, available, childrenAvailable } = amounts[id] || {}
      if (!totalAvailable || totalAvailable <= 0) return
      const node: TTreeNode = {
        id,
        name: uniqueName,
        symbol,
        color: colorHEX || colorGenerated,
      }

      if (!children.length || !childrenAvailable) {
        node.amount = amounts[id].totalAvailable
        data.push(node)
        return
      }

      node.children = []
      if (available) {
        node.children?.push({
          name: uniqueName + ' (основная)',
          id,
          amount: available,
          symbol,
          color: colorHEX || colorGenerated,
        })
      }
      children.forEach(child => {
        const { uniqueName, symbol, colorGenerated } = child
        const childId = child.id
        const { available } = amounts?.[id]?.children?.[childId] || {}
        if (!available || available <= 0) return
        node.children?.push({
          name: uniqueName,
          symbol,
          id: childId,
          amount: available,
          color: colorGenerated,
        })
      })
      node.children = node.children.sort(
        (a, b) => (a.amount || 0) - (b.amount || 0)
      )
      data.push(node)
    })

    if (toBeBudgeted > 0) {
      data.push({
        name: 'Нераспределённые деньги',
        id: 'toBeBudgeted',
        amount: toBeBudgeted,
      })
    }

    if (budgetedInFuture > 0) {
      data.push({
        name: 'Будущие бюджеты',
        id: 'budgetedInFuture',
        color: '#cccccc',
        amount: budgetedInFuture,
      })
    }

    data = data.sort((a, b) => {
      const amountA = amounts[a.id]?.totalAvailable || 0
      const amountB = amounts[b.id]?.totalAvailable || 0
      return amountA - amountB
    })

    return data
  }

  const handleClick = useCallback(
    (obj: any) => {
      const id = obj?.id
      if (!id) return
      if (!onSelect) return
      if (id === 'toBeBudgeted') return
      if (id === 'budgetedInFuture') return
      onSelect(id)
    },
    [onSelect]
  )

  const data = getData()

  return (
    <ResponsiveContainer height={560}>
      <Treemap
        data={data}
        dataKey="amount"
        stroke={theme.palette.divider}
        fill={theme.palette.background.paper}
        // @ts-ignore
        content={<CustomizedContent />}
        onClick={handleClick}
        animationDuration={100}
      >
        <Tooltip animationDuration={100} content={<CustomTooltip />} />
      </Treemap>
    </ResponsiveContainer>
  )
}

type TContentProps = TTreeNode & {
  area: number
  depth: number
  width: number
  height: number
  x: number
  y: number
  index: number
  fill: string
  stroke: string
  isAnimationActive: boolean
  isUpdateAnimationActive: boolean
  // root: {children: Array(21), x: 0, y: 0, width: 752, height: 600, …}
  type: string
  value: number
  // z: true
}

function CustomizedContent(props: TContentProps) {
  const {
    // depth,
    // index,
    x,
    y,
    width,
    height,
    color,
    name = '',
    symbol = '',
    amount = 0,
    children,
    fill,
    id,
  } = props

  const charLength = 8
  const lineHeight = 16
  const hasChildren = !!children?.length
  const rectWidth = width - 2
  const rectHeight = height - 2
  const shortSide = Math.min(rectWidth, rectHeight)
  const maxStringLength = Math.floor(rectWidth / charLength)

  let value: string = formatMoney(amount, null, 0)
  value = value.length > maxStringLength ? '' : value
  const shortenedName =
    name.length > maxStringLength
      ? name.slice(0, maxStringLength - 2).trim() + '…'
      : name

  const getLineArray = (): string[] => {
    if (rectWidth < 10 || height < lineHeight) return []
    if (rectWidth < 40) return [symbol]
    if (height < lineHeight * 2) return [shortenedName]
    if (height < lineHeight * 3) return [shortenedName, value].filter(Boolean)
    return [shortenedName, value].filter(Boolean)
  }
  let strArr = getLineArray()

  let bgColor = hasChildren ? 'none' : color
  let textColor = color ? getMostContrast(color) : fill
  let stroke = 'none'
  let strokeWidth = 0
  let strokeDasharray = '0'
  if (id === 'toBeBudgeted') {
    bgColor = fill
    textColor = getMostContrast(fill)
    stroke = textColor
    strokeWidth = 1
    strokeDasharray = '6 4'
  }
  return (
    <g>
      <rect
        x={x + 1}
        y={y + 1}
        rx={shortSide > 16 ? 8 : shortSide / 2}
        width={rectWidth}
        height={rectHeight}
        fill={bgColor}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
      />

      {!hasChildren && strArr.length && (
        <text
          x={x + width / 2}
          y={y + height / 2 - 4 - strArr.length * (lineHeight / 2)}
          textAnchor="middle"
          fill={textColor}
          fontSize={12}
          strokeWidth={0}
        >
          {strArr.map(str => (
            <tspan x={x + width / 2} dy={lineHeight}>
              {str}
            </tspan>
          ))}
        </text>
      )}
    </g>
  )
}

type TPayload = {
  // chartType: undefined
  color: string
  dataKey: string
  fill: string
  // formatter: undefined
  name: string
  payload: any
  // type: undefined
  // unit: undefined
  value: number
}

const CustomTooltip = (props: any) => {
  const payload = props.payload as TPayload[]
  const active = props.active as boolean
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]?.payload || {}

  return (
    <Card elevation={10} sx={{ p: 2 }}>
      <Typography variant="body2">
        {name}:{' '}
        <Amount value={value} decMode="ifAny" instrument="user" noShade />
      </Typography>
    </Card>
  )
}
