import React, { FC, ReactElement } from 'react'
import Button, { ButtonProps } from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import { Modify } from '@shared/types'
import { SmartDialog, TSmartDialogProps } from './SmartDialog'
import { popoverStack } from '@shared/hooks/usePopoverStack'

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
  ConfirmCommonProps & TSmartDialogProps,
  { children: ReactElement }
>
export const Confirm: FC<ConfirmProps> = ({
  onOk,
  children,
  elKey,
  ...rest
}) => {
  const confirm = popoverStack.useActions(elKey)

  const handleOk = () => {
    confirm.close()
    onOk()
  }
  if (!children) return null
  return (
    <>
      {React.Children.only(
        React.cloneElement(children, { onClick: confirm.open })
      )}
      <ConfirmModal
        {...rest}
        elKey={elKey}
        onOk={handleOk}
        onCancel={confirm.close}
      />
    </>
  )
}

type ConfirmModalProps = ConfirmCommonProps &
  TSmartDialogProps & { onCancel: () => void }
const ConfirmModal: FC<ConfirmModalProps> = props => {
  const {
    onCancel,
    onOk,
    title = 'Вы уверены?',
    description,
    cancelText = 'Отменить',
    okText = 'OK',
    okColor = 'primary',
    okVariant = 'contained',
    ...rest
  } = props
  return (
    <SmartDialog onClose={onCancel} {...rest}>
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
    </SmartDialog>
  )
}
