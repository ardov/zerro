import { useBreakpointDown } from '6-shared/hooks/useBreakpointDown'
import type { DialogProps } from '@mui/material'
import { Dialog, SwipeableDrawer } from '@mui/material'
import { popoverStack } from '6-shared/historyPopovers'

export type TSmartDialogProps = Omit<DialogProps, 'open'> & { elKey: string }

const drawerPaperProps = {
  sx: { maxHeight: 'calc(100vh - 48px)', borderRadius: '8px 8px 0 0' },
}

export function SmartDialog(props: TSmartDialogProps) {
  const { elKey, ...dialogProps } = props
  const [open, onOpen, onClose] = popoverStack.usePopoverState(elKey)
  const isMobile = useBreakpointDown('sm')

  return isMobile ? (
    <SwipeableDrawer
      {...dialogProps}
      anchor="bottom"
      onOpen={onOpen}
      disableSwipeToOpen
      open={open}
      onClose={onClose}
      keepMounted={false}
      ModalProps={{ keepMounted: false }}
      slotProps={{ paper: drawerPaperProps }}
    />
  ) : (
    <Dialog
      {...dialogProps}
      open={open}
      onClose={onClose}
      keepMounted={false}
    />
  )
}
