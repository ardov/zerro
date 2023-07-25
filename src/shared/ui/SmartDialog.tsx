import React from 'react'
import {
  Dialog,
  DialogProps,
  SwipeableDrawer,
  Theme,
  useMediaQuery,
} from '@mui/material'
import { popoverStack } from '@shared/historyPopovers'

export type TSmartDialogProps = Omit<DialogProps, 'open'> & { elKey: string }

const drawerPaperProps = {
  sx: { maxHeight: 'calc(100vh - 48px)', borderRadius: '8px 8px 0 0' },
}

export function SmartDialog(props: TSmartDialogProps) {
  const { elKey, ...dialogProps } = props
  const [open, onOpen, onClose] = popoverStack.usePopoverState(elKey)
  const isMobile = useMediaQuery<Theme>(theme => theme.breakpoints.down('sm'))

  if (!isMobile)
    return (
      <Dialog
        {...dialogProps}
        open={open}
        onClose={onClose}
        keepMounted={false}
      />
    )

  return (
    <SwipeableDrawer
      {...dialogProps}
      anchor="bottom"
      onOpen={onOpen}
      disableSwipeToOpen
      PaperProps={drawerPaperProps}
      open={open}
      onClose={onClose}
      keepMounted={false}
    />
  )
}
