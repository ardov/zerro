import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { Redirect } from 'react-router-dom'
import { format } from 'date-fns'
import { TagTable } from './containers/TagTable'
import TransferTable from './containers/TransferTable'
import MonthInfo from './containers/MonthInfo'
import { ToBeBudgeted } from './containers/ToBeBudgeted'
import MonthSelector from './MonthSelect'
import getMonthDates from './selectors/getMonthDates'
import EmojiIcon from 'components/EmojiIcon'
import {
  Box,
  Drawer,
  useMediaQuery,
  Typography,
  IconButton,
} from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import WarningSign from './containers/WarningSign'
import GoalsProgressWidget from './containers/GoalsProgressWidget'
import { Tooltip } from 'components/Tooltip'
import CloseIcon from '@material-ui/icons/Close'
import { getPopulatedTag } from 'store/localData/tags'
import { Total, Line } from './containers/components'
import { getAmountsForTag } from './selectors/getAmountsByTag'
import Rhythm from 'components/Rhythm'
import { useMonth } from './useMonth'
import { DnDContext } from './containers/DnDContext'

export default function BudgetsRouter() {
  const [month] = useMonth()
  const monthList = useSelector(getMonthDates)
  const minMonth = monthList[0]
  const maxMonth = monthList[monthList.length - 1]

  if (!month)
    return <Redirect to={`/budget/${format(new Date(), 'yyyy-MM')}`} />

  if (month < minMonth)
    return <Redirect to={`/budget/${format(minMonth, 'yyyy-MM')}`} />

  if (month > maxMonth)
    return <Redirect to={`/budget/${format(maxMonth, 'yyyy-MM')}`} />

  return <Budgets />
}

const useStyles = makeStyles(theme => ({
  drawerWidth: { width: 360 },
  grid: {
    display: 'grid',
    padding: theme.spacing(3),
    gap: `${theme.spacing(3)}px`,
    gridTemplateColumns: '1fr 1fr 1fr',
    gridTemplateAreas: `
      'month-select   goals     to-be-budgeted'
      'tags           tags      tags'
      'transfers      transfers transfers'`,
    width: '100%',
    maxWidth: 800,
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1, 1, 10),
    },
    [theme.breakpoints.down('xs')]: {
      gap: `${theme.spacing(2)}px`,
      padding: theme.spacing(1, 1, 10),
      gridTemplateColumns: '1fr',
      gridTemplateAreas: `'month-select' 'goals' 'to-be-budgeted' 'tags' 'transfers'`,
    },
  },
  monthSelect: { gridArea: 'month-select' },
  goals: { gridArea: 'goals' },
  toBeBudgeted: { gridArea: 'to-be-budgeted' },
  tags: { gridArea: 'tags' },
  transfers: { gridArea: 'transfers' },
}))

function Budgets() {
  const monthList = useSelector(getMonthDates)
  const minMonth = monthList[0]
  const maxMonth = monthList[monthList.length - 1]
  const [month, setMonth] = useMonth()
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('md'))
  const [showDrawer, setShowDrawer] = useState(false)
  const [selectedTag, setSelectedTag] = useState(null)
  const c = useStyles()
  const index = monthList.findIndex(date => date === month)

  const drawerVisibility = !isMobile || !!showDrawer
  const closeDrawer = () => {
    setSelectedTag(null)
    setShowDrawer(false)
  }
  const openDrawer = (id = null) => {
    setSelectedTag(id)
    setShowDrawer(true)
  }

  return (
    <DnDContext>
      <Box display="flex" justifyContent="center" position="relative">
        <Box className={c.grid}>
          <MonthSelector
            onChange={setMonth}
            className={c.monthSelect}
            {...{ minMonth, maxMonth, value: month }}
          />
          <GoalsProgressWidget className={c.goals} month={month} />
          <ToBeBudgeted
            className={c.toBeBudgeted}
            index={index}
            onClick={() => openDrawer(null)}
          />
          <TagTable
            className={c.tags}
            openDetails={openDrawer}
            onOpenMonthDrawer={() => openDrawer(null)}
          />
          <TransferTable className={c.transfers} month={monthList[index]} />
        </Box>

        <WarningSign />

        <Drawer
          classes={
            isMobile ? null : { paper: c.drawerWidth, root: c.drawerWidth }
          }
          variant={isMobile ? 'temporary' : 'persistent'}
          anchor="right"
          open={drawerVisibility}
          onClose={closeDrawer}
        >
          {selectedTag ? (
            <TagPreview
              month={month}
              index={index}
              onClose={closeDrawer}
              id={selectedTag}
            />
          ) : (
            <MonthInfo month={month} index={index} onClose={closeDrawer} />
          )}
        </Drawer>
      </Box>
    </DnDContext>
  )
}

function TagPreview({ month, index, onClose, id }) {
  const tag = useSelector(state => getPopulatedTag(state, id))
  const amounts = useSelector(getAmountsForTag)(month, id)
  if (!amounts) return null

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
