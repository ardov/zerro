import React from 'react'
import { useSelector } from 'react-redux'
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
} from 'recharts'
import getMonthDates from './selectors/getMonthDates'
import EmojiIcon from 'components/EmojiIcon'
import { Box, Typography, IconButton, useTheme } from '@material-ui/core'
import { Tooltip } from 'components/Tooltip'
import CloseIcon from '@material-ui/icons/Close'
import { getPopulatedTag } from 'store/localData/tags'
import { Total, Line } from './containers/components'
import { getAmountsForTag, getAmountsByTag } from './selectors/getAmountsByTag'
import Rhythm from 'components/Rhythm'
import { makeStyles } from '@material-ui/styles'
import { useMonth } from './useMonth'

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
  const theme = useTheme()
  const [month] = useMonth()
  const tag = useSelector(state => getPopulatedTag(state, id))
  const amounts = useSelector(getAmountsForTag)(month, id)
  const allAmounts = useSelector(getAmountsByTag)
  const dates = useSelector(getMonthDates)
  if (!amounts) return null

  const tagHistory = dates
    .map(month => {
      let dataPoint = tag.parent
        ? allAmounts[month][tag.parent].children[id]
        : allAmounts[month][id]
      return { ...dataPoint, date: month }
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
  const isParent = !!amounts.children

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
      <Total name="Доступно" value={available} />

      <Rhythm gap={1} p={3}>
        <div className={c.base} style={{ width: '100%', height: 100 }}>
          <ResponsiveContainer>
            <BarChart
              width={200}
              height={100}
              data={tagHistory}
              barGap={2}
              margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
              // onMouseMove={e => console.log(e)}
            >
              {/* <ChartTooltip /> */}

              <Bar
                dataKey={isParent ? 'totalBudgeted' : 'budgeted'}
                fill={theme.palette.primary.main}
                radius={[2, 2, 0, 0]}
              />
              <Bar
                dataKey={isParent ? 'totalOutcome' : 'outcome'}
                fill={theme.palette.error.main}
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <Line
          name="Остаток с прошлого месяца"
          amount={isParent ? totalLeftover : leftover}
        />
        <Line name="Бюджет" amount={isParent ? totalBudgeted : budgeted} />
        <Line name="Расход" amount={isParent ? totalOutcome : outcome} />
        <Line name="— Переводы" amount={transferOutcome} />
      </Rhythm>
    </Box>
  )
}
