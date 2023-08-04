import React, { useCallback } from 'react'
import Button, { ButtonProps } from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import { SmartDialog } from './SmartDialog'
import { registerPopover } from '6-shared/historyPopovers'

type ConfirmCommonProps = {
  onOk: () => void
  title?: string
  description?: string
  cancelText?: string
  okText?: string
  okColor?: ButtonProps['color']
  okVariant?: ButtonProps['variant']
}

const confirmHooks = registerPopover<ConfirmCommonProps>('confirm', {
  onOk: () => {},
})

export const useConfirm = (props: ConfirmCommonProps) => {
  const { open } = confirmHooks.useMethods()
  return useCallback(() => open(props), [open, props])
}

export const SmartConfirm = () => {
  const { displayProps, extraProps } = confirmHooks.useProps()

  const {
    onOk,
    title = 'Вы уверены?',
    description,
    cancelText = 'Отменить',
    okText = 'OK',
    okColor = 'primary',
    okVariant = 'contained',
  } = extraProps
  return (
    <SmartDialog elKey={confirmHooks.key}>
      <DialogTitle>{title}</DialogTitle>

      {!!description && (
        <DialogContent>
          <DialogContentText>{description}</DialogContentText>
        </DialogContent>
      )}

      <DialogActions>
        <Button onClick={displayProps.onClose} color="primary">
          {cancelText}
        </Button>
        <Button
          onClick={() => {
            displayProps.onClose()
            onOk()
          }}
          color={okColor}
          variant={okVariant}
          autoFocus
        >
          {okText}
        </Button>
      </DialogActions>
    </SmartDialog>
  )
}
