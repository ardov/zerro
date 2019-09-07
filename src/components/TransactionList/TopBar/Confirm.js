import React from 'react'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'

export default function Confirm({
  title = 'Вы уверены?',
  description = null,
  open = false,
  onCancel,
  onOk,
  cancelText = 'Отменить',
  okText = 'OK',
  okColor = 'primary',
  okVariant = 'contained',
}) {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle id="alert-dialog-title">{title}</DialogTitle>

      {!!description && (
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Let Google help apps determine location. This means sending
            anonymous location data to Google, even when no apps are running.
          </DialogContentText>
        </DialogContent>
      )}

      <DialogActions>
        <Button onClick={onCancel} color="primary">
          {cancelText}
        </Button>
        <Button onClick={onOk} color={okColor} variant={okVariant} autoFocus>
          {okText}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export function withConfirm(Component) {
  return (
    <>
      <Component></Component>
    </>
  )
}
