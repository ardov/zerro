import React, { useState, useEffect } from 'react'
import TransactionList from 'components/TransactionList'
import {
  Box,
  Drawer,
  useMediaQuery,
  Typography,
  Paper,
  Theme,
} from '@mui/material'
import { makeStyles } from '@mui/styles'
import { TransactionPreview } from 'components/TransactionPreview'
import { sendEvent } from 'shared/helpers/tracking'
import { Helmet } from 'react-helmet'
import { useSearchParam } from 'shared/hooks/useSearchParam'
import { useAppSelector } from 'models'
import { getTransactions } from 'models/data/transactions'

const useStyles = makeStyles(theme => ({
  drawerWidth: {
    width: 360,
    [theme.breakpoints.down('sm')]: { width: '100vw' },
  },
}))

export default function TransactionsView() {
  const isMobile = useMediaQuery<Theme>(theme => theme.breakpoints.down('md'))
  const [opened, setOpened] = useSearchParam('transaction')
  const openedTransaction = useAppSelector(getTransactions)[opened || '']
  const [checkedDate, setCheckedDate] = useState<Date | null>(null)
  const c = useStyles()

  // send analytics
  useEffect(() => {
    if (openedTransaction) sendEvent('Transaction: see details')
    if (opened && !openedTransaction) setOpened(null)
  }, [opened, openedTransaction, setOpened])

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
          <Paper
            sx={{
              flex: '1 1 auto',
              display: 'flex',
              overflow: 'hidden',
              maxWidth: 560,
              pb: isMobile ? 7 : 0,
            }}
          >
            <TransactionList
              checkedDate={checkedDate}
              sx={{ flex: '1 1 auto' }}
            />
          </Paper>
        </Box>

        <Drawer
          classes={{ paper: c.drawerWidth, root: c.drawerWidth }}
          variant={isMobile ? 'temporary' : 'persistent'}
          anchor="right"
          open={!isMobile || !!opened}
          onClose={() => setOpened(null)}
        >
          {openedTransaction && opened ? (
            <TransactionPreview
              id={opened}
              key={opened}
              onClose={() => setOpened(null)}
              onOpenOther={setOpened}
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
