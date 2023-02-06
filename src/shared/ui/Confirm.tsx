import React, { FC, ReactElement } from 'react'
import Button, { ButtonProps } from '@mui/material/Button'
import Dialog, { DialogProps } from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import { Modify } from '@shared/types'

type ConfirmCommonProps = {
  onOk: () => void
  title?: string
  description?: string
  cancelText?: string
  okText?: string
  okColor?: ButtonProps['color']
  okVariant?: ButtonProps['variant']
}
type ConfirmProps = Modify<
  ConfirmCommonProps & Omit<DialogProps, 'open'>,
  { children: ReactElement }
>
export const Confirm: FC<ConfirmProps> = ({ onOk, children, ...rest }) => {
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

type ConfirmModalProps = ConfirmCommonProps &
  DialogProps & { onCancel: () => void }
export const ConfirmModal: FC<ConfirmModalProps> = props => {
  const {
    onCancel,
    onOk,
    title = 'Вы уверены?',
    description,
    open,
    cancelText = 'Отменить',
    okText = 'OK',
    okColor = 'primary',
    okVariant = 'contained',
    ...rest
  } = props
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
