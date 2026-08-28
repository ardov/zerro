import { Button } from './Button'
import { useCallback } from 'react'
import {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from './Dialog'
import { SmartDialog } from './SmartDialog'
import { registerPopover } from '6-shared/historyPopovers'
import { useTranslation } from 'react-i18next'

type ConfirmCommonProps = {
  onOk: () => void
  title?: string
  description?: string
  cancelText?: string
  okText?: string
}

const confirmHooks = registerPopover<ConfirmCommonProps>('confirm', {
  onOk: () => {},
})

export const useConfirm = (props: ConfirmCommonProps) => {
  const { open } = confirmHooks.useMethods()
  return useCallback(() => open(props), [open, props])
}

export const SmartConfirm = () => {
  const { t } = useTranslation('confirmDefaults')
  const { displayProps, extraProps } = confirmHooks.useProps()

  const {
    onOk,
    title = t('title'),
    description,
    cancelText = t('cancelText'),
    okText = t('okText'),
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
          color="primary"
          variant="contained"
          autoFocus
        >
          {okText}
        </Button>
      </DialogActions>
    </SmartDialog>
  )
}
