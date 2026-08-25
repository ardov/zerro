import { Drawer } from '@mui/material'
import { registerPopover } from '6-shared/historyPopovers'
import type { TTransactionId } from '6-shared/types'
import type { TransactionPreviewProps } from '../transaction/TransactionPreview'
import { TransactionPreview } from '../transaction/TransactionPreview'

export type TransactionPreviewDrawerProps = {
  id: TTransactionId
  onOpenOther?: TransactionPreviewProps['onOpenOther']
  onSelectSimilar?: TransactionPreviewProps['onSelectSimilar']
}

const trDrawerHooks = registerPopover('transaction-preview-drawer', {
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
      <div className="flex h-screen min-w-80 flex-col">
        <TransactionPreview
          id={id}
          onClose={onClose}
          onOpenOther={onOpenOther}
          onSelectSimilar={onSelectSimilar}
        />
      </div>
    </Drawer>
  )
}

const drawerWidth = { xs: '100vw', sm: 360 }
// MUI Slide uses the modal root as its viewport; only size the paper.
const contentSx = {
  [`& .MuiDrawer-paper`]: { width: drawerWidth },
}
