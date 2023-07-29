import React from 'react'
import { Drawer, Box } from '@mui/material'
import { makePopoverHooks } from '@shared/historyPopovers'
import { TTransactionId } from '@shared/types'
import {
  TransactionPreview,
  TransactionPreviewProps,
} from './TransactionPreview'

export type TransactionPreviewDrawerProps = {
  id: TTransactionId
  onOpenOther?: TransactionPreviewProps['onOpenOther']
  onSelectSimilar?: TransactionPreviewProps['onSelectSimilar']
}

const trDrawerHooks = makePopoverHooks('transaction-preview-drawer', {
  id: '',
} as TransactionPreviewDrawerProps)

export const useTransactionPreview = trDrawerHooks.useMethods

export const SmartTransactionPreview = () => {
  const drawer = trDrawerHooks.useProps()
  const { id, onOpenOther = () => {}, onSelectSimilar } = drawer.extraProps
  const { onClose, open } = drawer.displayProps
  return (
    <Drawer
      anchor="right"
      onClose={onClose}
      open={open}
      sx={contentSx}
      keepMounted={false}
    >
      <Box height="100vh" display="flex" flexDirection="column" minWidth={320}>
        <TransactionPreview
          id={id}
          onClose={onClose}
          onOpenOther={onOpenOther}
          onSelectSimilar={onSelectSimilar}
        />
      </Box>
    </Drawer>
  )
}

const drawerWidth = { xs: '100vw', sm: 360 }
const contentSx = {
  width: drawerWidth,
  [`& .MuiDrawer-paper`]: { width: drawerWidth },
}
