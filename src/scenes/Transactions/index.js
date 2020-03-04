import React, { useState, useEffect } from 'react'
import TransactionList from 'components/TransactionList'
import {
  Box,
  Drawer,
  useMediaQuery,
  Typography,
  Paper,
} from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import TransactionPreview from 'components/TransactionPreview'
import sendEvent from 'helpers/sendEvent'

const useStyles = makeStyles(theme => ({
  drawerWidth: { width: 360 },
}))

export default function TransactionsView() {
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('sm'))
  const [opened, setOpened] = useState(null)
  const [checkedDate, setCheckedDate] = useState(null)
  const c = useStyles()

  // send analytics
  useEffect(() => {
    if (opened) sendEvent('Transaction: see details')
  }, [opened])

  return (
    <Box display="flex">
      <Box
        p={isMobile ? 0 : 2}
        height="100vh"
        flexGrow={1}
        minWidth={0}
        display="flex"
        justifyContent="center"
      >
        <Box
          flex="1 1 auto"
          display="flex"
          overflow="hidden"
          maxWidth={560}
          component={Paper}
        >
          <Box flex="1 1 auto" clone>
            <TransactionList {...{ opened, setOpened, checkedDate }} />
          </Box>
        </Box>
      </Box>

      <Drawer
        classes={
          isMobile ? null : { paper: c.drawerWidth, root: c.drawerWidth }
        }
        variant={isMobile ? 'temporary' : 'persistent'}
        anchor="right"
        open={!isMobile || !!opened}
        onClose={() => setOpened(null)}
      >
        {opened ? (
          <TransactionPreview
            id={opened}
            key={opened}
            onClose={() => setOpened(null)}
            onSelectSimilar={date => setCheckedDate(new Date(date))}
          />
        ) : (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            minHeight="100vh"
            color="text.hint"
            p={3}
          >
            <Typography variant="body2" align="center" color="inherit">
              Выберите операцию,
              <br />
              чтобы увидеть детали
            </Typography>
          </Box>
        )}
      </Drawer>
    </Box>
  )
}
