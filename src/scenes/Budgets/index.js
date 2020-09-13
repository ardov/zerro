import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { Redirect } from 'react-router-dom'
import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'
import { TagTable } from './containers/TagTable'
import TransferTable from './containers/TransferTable'
import MonthInfo from './containers/MonthInfo'
import { ToBeBudgeted } from './containers/ToBeBudgeted'
import MonthSelector from './MonthSelect'
import getMonthDates from './selectors/getMonthDates'
import { Box, Drawer, Paper, useMediaQuery } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import WarningSign from './containers/WarningSign'
import GoalsProgressWidget from './containers/GoalsProgressWidget'
import { useMonth } from './useMonth'
import { DnDContext } from './containers/DnDContext'
import { TagPreview } from './containers/TagPreview'
import { Helmet } from 'react-helmet'
import { SankeyChart } from './SankeyChart'

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
      'transfers      transfers transfers'
      'chart          chart     chart'`,
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
  chart: { gridArea: 'chart' },
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
    <>
      <Helmet>
        <title>
          Бюджет на {format(month, 'LLLL yyyy', { locale: ru })} | Zerro
        </title>
        <meta name="description" content="" />
        <link rel="canonical" href="https://zerro.app/budget" />
      </Helmet>

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
            <Paper className={c.chart}>
              <SankeyChart />
            </Paper>
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
              <TagPreview onClose={closeDrawer} id={selectedTag} />
            ) : (
              <MonthInfo month={month} index={index} onClose={closeDrawer} />
            )}
          </Drawer>
        </Box>
      </DnDContext>
    </>
  )
}
