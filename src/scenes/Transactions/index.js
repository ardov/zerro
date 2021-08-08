import React, { useState, useEffect } from 'react'
import TransactionList from 'components/TransactionList'
import {
  Box,
  Drawer,
  useMediaQuery,
  Typography,
  Paper,
} from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import TransactionPreview from 'components/TransactionPreview'
import { sendEvent } from 'helpers/tracking'
import { Helmet } from 'react-helmet'
import { useSearchParam } from 'helpers/useSearchParam'

const useStyles = makeStyles(theme => ({
  drawerWidth: {
    width: 360,
    [theme.breakpoints.down('sm')]: { width: '100vw' },
  },
}))

export default function TransactionsView() {
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('md'))
  const [opened, setOpened] = useSearchParam('transaction')
  const [checkedDate, setCheckedDate] = useState(null)
  const c = useStyles()

  // send analytics
  useEffect(() => {
    if (opened) sendEvent('Transaction: see details')
  }, [opened])

  return (
    <>
      <Helmet>
        <title>Операции | Zerro</title>
        <meta name="description" content="Список операций" />
        <link rel="canonical" href="https://zerro.app/transactions" />
      </Helmet>

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
            style={isMobile ? { paddingBottom: 56 } : null}
          >
            <Box flex="1 1 auto" clone>
              <TransactionList {...{ checkedDate }} />
            </Box>
          </Box>
        </Box>

        <Drawer
          classes={{ paper: c.drawerWidth, root: c.drawerWidth }}
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
    </>
  )
}
