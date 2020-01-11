import React, { useState } from 'react'
import { connect } from 'react-redux'
import startOfMonth from 'date-fns/startOfMonth'
import AccountList from 'components/AccountList'
import TagTable from './containers/TagTable'
import TransferTable from './containers/TransferTable'
import BudgetInfo from './containers/BudgetInfo'
import MonthSelector from './MonthSelect'
import getMonthDates from './selectors/getMonthDates'
import {
  Box,
  Hidden,
  Drawer,
  Typography,
  useMediaQuery,
} from '@material-ui/core'
import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'

const useStyles = makeStyles(theme => ({
  drawerWidth: { width: 360 },
}))

const Budgets = ({ monthDates }) => {
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('xs'))
  const [month, setMonth] = useState(+startOfMonth(new Date()))
  const [openDrawer, setOpenDrawer] = useState(false)
  const c = useStyles()

  const setCurrentMonth = () => setMonth(+startOfMonth(new Date()))
  const setMonthByIndex = i => setMonth(monthDates[i])
  const index = monthDates.findIndex(date => date === month)

  return (
    <Box p={isMobile ? 1 : 3} display="flex">
      <Box flexGrow="1">
        <Grid container spacing={3}>
          {/* <Grid item xs={12} md={4}>
            <MonthSelector
              months={monthDates}
              current={index}
              onSetCurrent={setCurrentMonth}
              onChange={setMonthByIndex}
            />
          </Grid> */}
          {/* <Grid item xs={12} md={4}>
            <Box component={BudgetInfo} index={index} mt={3} />
          </Grid> */}
          {/* <Hidden smDown>
            <Box component={AccountList} mt={3} />
          </Hidden> */}
          <Grid item xs={12} md={12}>
            <TagTable index={index} date={monthDates[index]} />
            <Box component={TransferTable} index={index} mt={3} />
          </Grid>
        </Grid>
      </Box>
      <Drawer
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
            months={monthDates}
            current={index}
            onSetCurrent={setCurrentMonth}
            onChange={setMonthByIndex}
          />
          <Box pt={2} />
          <BudgetInfo index={index} />
          <Box pt={2} />
        </Box>
      </Drawer>
    </Box>
  )
}

export default connect(
  state => ({ monthDates: getMonthDates(state) }),
  null
)(Budgets)
