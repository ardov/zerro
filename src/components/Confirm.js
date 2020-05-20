import React from 'react'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'

export default function Confirm({ onOk, children, ...rest }) {
  const [open, setOpen] = React.useState(false)
  const openConfirm = () => setOpen(true)
  const closeConfirm = () => setOpen(false)
  const handleOk = () => {
    closeConfirm()
    onOk()
  }
  if (!children) return null
  return (
    <>
      {React.Children.only(
        React.cloneElement(children, { onClick: openConfirm })
      )}
      <ConfirmModal
        {...rest}
        open={open}
        onOk={handleOk}
        onCancel={closeConfirm}
      ></ConfirmModal>
    </>
  )
}

export function ConfirmModal({
  title = 'Вы уверены?',
  description = null,
  open = false,
  onCancel,
  onOk,
  cancelText = 'Отменить',
  okText = 'OK',
  okColor = 'primary',
  okVariant = 'contained',
  ...rest
}) {
  return (
    <Dialog open={open} onClose={onCancel} {...rest}>
      <DialogTitle>{title}</DialogTitle>

      {!!description && (
        <DialogContent>
          <DialogContentText>{description}</DialogContentText>
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
