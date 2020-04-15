import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import startOfMonth from 'date-fns/startOfMonth'
import TagTable from './containers/TagTable'
import TransferTable from './containers/TransferTable'
import BudgetInfo from './containers/BudgetInfo'
import MonthSelector from './MonthSelect'
import getMonthDates from './selectors/getMonthDates'
import {
  Box,
  // Hidden,
  // Drawer,
  // Typography,
  useMediaQuery,
} from '@material-ui/core'
import Grid from '@material-ui/core/Grid'
// import { makeStyles } from '@material-ui/core/styles'
import { DragDropContext } from 'react-beautiful-dnd'
import { moveFunds } from './thunks'
import MoveMoneyModal from './containers/MoveMoneyModal'
import WarningSign from './containers/WarningSign'

// const useStyles = makeStyles(theme => ({
//   drawerWidth: { width: 360 },
// }))

const parentStyle = { overflowX: 'hidden' } // need this to prevent horizontal scrolling on mobile

export default function Budgets() {
  const monthList = useSelector(getMonthDates)
  const dispatch = useDispatch()

  const minMonth = monthList[0]
  const maxMonth = monthList[monthList.length - 1]
  const curMonth = +startOfMonth(new Date())

  const isMobile = useMediaQuery(theme => theme.breakpoints.down('xs'))
  const [month, setMonth] = useState(curMonth)
  // const [openDrawer, setOpenDrawer] = useState(false)
  const [moneyModalProps, setMoneyModalProps] = useState({ open: false })
  // const c = useStyles()

  const index = monthList.findIndex(date => date === month)

  const moveMoney = e => {
    if (
      e.source &&
      e.destination &&
      e.source.droppableId !== e.destination.droppableId
    ) {
      const source = e.source.droppableId
      const destination = e.destination.droppableId

      setMoneyModalProps({
        open: true,
        source,
        destination,
        month,
        key: source + destination + month,
        onMoneyMove: amount => {
          if (amount) dispatch(moveFunds(amount, source, destination, month))
          setMoneyModalProps({ open: false })
        },
      })
    }
  }

  return (
    <DragDropContext
      onDragEnd={moveMoney}
      onDragStart={() => {
        if (window.navigator.vibrate) {
          window.navigator.vibrate(100)
        }
      }}
    >
      <Box p={isMobile ? 1 : 3} display="flex" style={parentStyle}>
        <MoveMoneyModal
          {...moneyModalProps}
          onClose={() => setMoneyModalProps({ open: false })}
        />
        <Box flexGrow="1">
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Box position="sticky" top="24px">
                <MonthSelector
                  onChange={setMonth}
                  {...{ minMonth, maxMonth, value: month }}
                />
                <Box component={BudgetInfo} index={index} mt={3} />
              </Box>
            </Grid>

            <Grid item xs={12} md={9}>
              <TagTable index={index} date={monthList[index]} required={true} />
              <Box mt={3}>
                <TagTable index={index} date={monthList[index]} />
              </Box>
              <Box mt={3}>
                <TransferTable month={monthList[index]} />
              </Box>

              {/* TODO make bottom navigation and remove this placeholder */}
              <Box height={48} />
            </Grid>
          </Grid>
        </Box>
        <WarningSign />
        {/* <Drawer
          classes={
            isMobile ? null : { paper: c.drawerWidth, root: c.drawerWidth }
          }
          variant={isMobile ? 'temporary' : 'persistent'}
          anchor="right"
          open={!isMobile || !!openDrawer}
          onClose={() => setOpenDrawer(false)}
        >
          <Box display="flex" flexDirection="column" minHeight="100vh" p={3}>
            <MonthSelector
              months={monthList}
              current={index}
              onSetCurrent={setCurrentMonth}
              onChange={setMonthByIndex}
            />
            <Box pt={2} />
            <BudgetInfo index={index} />
            <Box pt={2} />
          </Box>
        </Drawer> */}
      </Box>
    </DragDropContext>
  )
}
