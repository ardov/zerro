import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import startOfMonth from 'date-fns/startOfMonth'
import TagTable from './containers/TagTable'
import TransferTable from './containers/TransferTable'
import BudgetInfo from './containers/BudgetInfo'
import ToBeBudgeted from './containers/ToBeBudgeted'
import MonthSelector from './MonthSelect'
import getMonthDates from './selectors/getMonthDates'
import { Box, Drawer, useMediaQuery } from '@material-ui/core'
import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import { DragDropContext } from 'react-beautiful-dnd'
import { moveFunds } from './thunks'
import MoveMoneyModal from './containers/MoveMoneyModal'
import WarningSign from './containers/WarningSign'
import GoalsProgressWidget from './containers/GoalsProgressWidget'

const useStyles = makeStyles(theme => ({ drawerWidth: { width: 360 } }))

export default function Budgets() {
  const monthList = useSelector(getMonthDates)
  const dispatch = useDispatch()

  const minMonth = monthList[0]
  const maxMonth = monthList[monthList.length - 1]
  const curMonth = +startOfMonth(new Date())

  const isMobile = useMediaQuery(theme => theme.breakpoints.down('sm'))
  const [month, setMonth] = useState(curMonth)
  const [showDrawer, setShowDrawer] = useState(false)
  const [selectedTag, setSelectedTag] = useState(null)
  const [moneyModalProps, setMoneyModalProps] = useState({ open: false })
  const c = useStyles()

  const index = monthList.findIndex(date => date === month)

  const drawerVisibility = !isMobile || !!showDrawer
  const closeDrawer = () => setShowDrawer(false)
  const openDrawer = (id = null) => {
    setSelectedTag(id)
    setShowDrawer(true)
  }

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
      <Box p={isMobile ? 1.5 : 3} display="flex">
        <MoveMoneyModal
          {...moneyModalProps}
          onClose={() => setMoneyModalProps({ open: false })}
        />
        <Box flexGrow="1">
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <MonthSelector
                onChange={setMonth}
                {...{ minMonth, maxMonth, value: month }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GoalsProgressWidget month={month} />
            </Grid>

            <Grid item xs={12} md={4}>
              <ToBeBudgeted index={index} onClick={() => openDrawer(null)} />
            </Grid>

            <Grid item xs={12} md={12}>
              <TagTable
                index={index}
                date={monthList[index]}
                required={true}
                openDetails={openDrawer}
              />
              <Box mt={3}>
                <TagTable
                  index={index}
                  date={monthList[index]}
                  openDetails={openDrawer}
                />
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
            <BudgetInfo month={month} index={index} onClose={closeDrawer} />
          )}
        </Drawer>
      </Box>
    </DragDropContext>
  )
}

function TagPreview({ month, index, onClose, id }) {
  return <Box>Tag preview {id}</Box>
}
