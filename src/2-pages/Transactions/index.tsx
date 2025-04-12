import React, { useState, FC, useCallback } from 'react'
import { TransactionList } from '3-widgets/transaction/TransactionList'
import {
  Box,
  Drawer,
  useMediaQuery,
  Paper,
  Theme,
  DrawerProps,
} from '@mui/material'
import {
  TrEmptyState,
  TransactionPreview,
} from '3-widgets/transaction/TransactionPreview'
import { Helmet } from 'react-helmet'
import { registerPopover } from '6-shared/historyPopovers'
import { TTransaction, TTransactionId } from '6-shared/types'
import { sendEvent } from '6-shared/helpers/tracking'
import { useTranslation } from 'react-i18next'

const sideWidth = 360
const sideSx = {
  width: sideWidth,
  flexShrink: 0,
  overflow: 'auto',
  bgcolor: 'background.paper',
}

export default function TransactionsView() {
  const { t } = useTranslation('transactions')
  const isMobile = useMediaQuery<Theme>(theme => theme.breakpoints.down('md'))
  const [checkedDate, setCheckedDate] = useState<Date | null>(null)
  const { open } = trPreview.useMethods()
  const openedProps = trPreview.useProps()
  const opened = openedProps.displayProps.open && openedProps.extraProps.id

  const handleTrOpen = useCallback(
    (id: TTransactionId) => {
      sendEvent('Transaction: see details')
      open({
        id,
        onSelectSimilar: changed => setCheckedDate(new Date(changed)),
      })
    },
    [open]
  )

  return (
    <>
      <Helmet>
        <title>{t('pageTitle')}</title>
        <meta name="description" content={t('pageDescription')} />
        <link rel="canonical" href="https://zerro.app/transactions" />
      </Helmet>
      <Box
        sx={{
          display: 'flex',
          height: '100vh',
        }}
      >
        <Box
          sx={{
            p: { xs: 0, md: 2 },
            flexGrow: 1,
            minWidth: 0,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Paper
            sx={{
              flex: '1 1 auto',
              display: 'flex',
              overflow: 'hidden',
              maxWidth: 560,
              pb: { xs: 7, md: 0 },
            }}
          >
            <TransactionList
              checkedDate={checkedDate}
              sx={{ flex: '1 1 auto' }}
              onTrOpen={handleTrOpen}
              opened={opened || undefined}
            />
          </Paper>
        </Box>

        {isMobile ? (
          <SideContent width={sideWidth} />
        ) : (
          <Box sx={sideSx}>
            <SideContent width={sideWidth} docked />
          </Box>
        )}
      </Box>
    </>
  )
}

const trPreview = registerPopover<
  {
    id?: TTransactionId
    onSelectSimilar?: (changed: TTransaction['changed']) => void
  },
  DrawerProps
>('transactionPreview', {})

const SideContent: FC<{ docked?: boolean; width: number }> = ({
  docked,
  width,
}) => {
  const { displayProps, extraProps, open } = trPreview.useProps()
  const { id, onSelectSimilar } = extraProps
  const isXS = useMediaQuery<Theme>(theme => theme.breakpoints.down('sm'))

  const openAnother = (id: TTransactionId) => {
    open({ id, onSelectSimilar })
  }

  const drawerContent = id ? (
    <TransactionPreview
      id={extraProps.id || ''}
      key={extraProps.id}
      onClose={displayProps.onClose}
      onOpenOther={openAnother}
      onSelectSimilar={onSelectSimilar}
    />
  ) : (
    <TrEmptyState />
  )

  if (docked) {
    return displayProps.open ? drawerContent : <TrEmptyState />
  }

  return (
    <Drawer {...displayProps} anchor="right">
      <Box sx={{ width: isXS ? '100vw' : width }}>{drawerContent}</Box>
    </Drawer>
  )
}
