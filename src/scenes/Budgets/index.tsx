import React, {
  useCallback,
  // useState
} from 'react'
import { useSelector } from 'react-redux'
import { Redirect } from 'react-router-dom'
import { TagTable } from './components/TagTable'
import { TransferTable } from './components/TransferTable'
import { MonthInfo } from './components/MonthInfo'
import { ToBeBudgeted } from './components/ToBeBudgeted'
import { MonthSelect } from './MonthSelect'
import { getMonthDates } from './selectors'
import {
  // Button,
  // Paper,
  Box,
  Drawer,
  Theme,
  useMediaQuery,
} from '@mui/material'
import { makeStyles } from '@mui/styles'
import { GoalsProgressWidget } from './components/GoalsProgressWidget'
import { useMonth } from './pathHooks'
import { DnDContext } from './components/DnDContext'
import { TagPreview } from './components/TagPreview'
import { Helmet } from 'react-helmet'
// import { SankeyChart } from './SankeyChart'
import { formatDate } from 'helpers/format'
import { useHotkeys } from 'react-hotkeys-hook'
import add from 'date-fns/add'
import sub from 'date-fns/sub'
import { MapWidget } from './MapWidget'
import { useSearchParam } from 'helpers/useSearchParam'
import { BudgetTransactionsDrawer } from './components/TransactionsDrawer'

export default function BudgetsRouter() {
  const [month] = useMonth()
  const monthList = useSelector(getMonthDates)
  const minMonth = monthList[0]
  const maxMonth = monthList[monthList.length - 1]
  if (!month)
    return (
      <Redirect to={`/budget/?month=${formatDate(new Date(), 'yyyy-MM')}`} />
    )
  if (month < minMonth)
    return <Redirect to={`/budget/?month=${formatDate(minMonth, 'yyyy-MM')}`} />
  if (month > maxMonth)
    return <Redirect to={`/budget/?month=${formatDate(maxMonth, 'yyyy-MM')}`} />
  return <Budgets />
}

const useStyles = makeStyles(theme => ({
  drawerWidth: {
    width: 360,
    [theme.breakpoints.down('sm')]: {
      width: '100vw',
    },
  },
  grid: {
    display: 'grid',
    padding: theme.spacing(3),
    gap: theme.spacing(3),
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gridTemplateAreas: `
      'month-select   goals     to-be-budgeted'
      'tags           tags      tags'
      'transfers      transfers transfers'
      'chart          chart     chart'
      'treemap        treemap   treemap'
    `,
    width: '100%',
    maxWidth: 800,
    [theme.breakpoints.down('md')]: {
      padding: theme.spacing(1, 1, 10),
    },
    [theme.breakpoints.down('sm')]: {
      gap: theme.spacing(2),
      padding: theme.spacing(1, 1, 10),
      gridTemplateColumns: '1fr',
      gridTemplateAreas: `'month-select' 'goals' 'to-be-budgeted' 'tags' 'transfers' 'treemap'`,
    },
  },
  monthSelect: { gridArea: 'month-select' },
  goals: { gridArea: 'goals' },
  toBeBudgeted: { gridArea: 'to-be-budgeted' },
  tags: { gridArea: 'tags' },
  transfers: { gridArea: 'transfers' },
  chart: { gridArea: 'chart' },
  treemap: { gridArea: 'treemap' },
}))

function Budgets() {
  const monthList = useSelector(getMonthDates)
  const minMonth = monthList[0]
  const maxMonth = monthList[monthList.length - 1]
  const [month, setMonth] = useMonth()
  const [drawerId, setDrawerId] = useSearchParam('drawer')
  const isMD = useMediaQuery<Theme>(theme => theme.breakpoints.down('lg'))
  // const isSM = useMediaQuery<Theme>(theme => theme.breakpoints.down('md'))
  // const [showSankey, setShowSankey] = useState(false)
  const c = useStyles()
  const drawerVisibility = !isMD || !!drawerId

  useHotkeys(
    'left',
    () => {
      const prevMonth = +sub(month, { months: 1 })
      if (minMonth <= prevMonth) setMonth(prevMonth)
    },
    [month, minMonth]
  )
  useHotkeys(
    'right',
    () => {
      const nextMonth = +add(month, { months: 1 })
      if (nextMonth <= maxMonth) setMonth(nextMonth)
    },
    [month, maxMonth]
  )

  const openOverview = useCallback(() => setDrawerId('overview'), [setDrawerId])
  const openTagInfo = useCallback(id => setDrawerId(id), [setDrawerId])
  const closeDrawer = useCallback(() => setDrawerId(), [setDrawerId])

  return (
    <>
      <Helmet>
        <title>Бюджет на {formatDate(month, 'LLLL yyyy')} | Zerro</title>
        <meta name="description" content="" />
        <link rel="canonical" href="https://zerro.app/budget" />
      </Helmet>

      <DnDContext>
        <Box display="flex" justifyContent="center" position="relative">
          <Box className={c.grid}>
            <MonthSelect
              className={c.monthSelect}
              onChange={setMonth}
              {...{ minMonth, maxMonth, value: month }}
            />
            <GoalsProgressWidget className={c.goals} />
            <ToBeBudgeted className={c.toBeBudgeted} onClick={openOverview} />
            <TagTable
              className={c.tags}
              openDetails={openTagInfo}
              onOpenMonthDrawer={openOverview}
            />
            <TransferTable className={c.transfers} />

            {/* {!isSM &&
              (showSankey ? (
                <Paper className={c.chart}>
                  <SankeyChart />
                </Paper>
              ) : (
                <Button
                  className={c.chart}
                  fullWidth
                  onClick={() => setShowSankey(true)}
                >
                  Показать распределение денег
                </Button>
              ))} */}

            <MapWidget className={c.treemap} onSelectTag={openTagInfo} />
          </Box>

          <Drawer
            classes={{ paper: c.drawerWidth, root: c.drawerWidth }}
            variant={isMD ? 'temporary' : 'persistent'}
            anchor="right"
            open={drawerVisibility}
            onClose={closeDrawer}
          >
            {(!drawerId || drawerId === 'overview') && (
              <MonthInfo onClose={closeDrawer} />
            )}
            {drawerId && <TagPreview onClose={closeDrawer} id={drawerId} />}
          </Drawer>

          <BudgetTransactionsDrawer />
        </Box>
      </DnDContext>
    </>
  )
}
