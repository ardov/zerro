import { useTranslation } from 'react-i18next'
import { useAsked } from '6-shared/overlays'
import { AdaptiveDialog } from './AdaptiveDialog'
import { Button } from './Button'
import {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from './Dialog'

export type ConfirmProps = {
  title?: string
  description?: string
  cancelText?: string
  okText?: string
}

/** A yes-or-no question, handed to `ask`:
 *
 * ```tsx
 * if (!(await ask(<Confirm title={t('deleteTitle')} okText={t('delete')} />)))
 *   return
 * dispatch(core.transactions.remove([id]))
 * ```
 *
 * It answers `true` for the confirming button and nothing at all for every way
 * of walking away — Cancel, Back, Escape, a click outside — so the caller has
 * one thing to check. What used to be an `onOk` callback stays where it was
 * written, after the `await`. */
export function Confirm({
  title,
  description,
  cancelText,
  okText,
}: ConfirmProps) {
  const { t } = useTranslation('confirmDefaults')
  const { open, answer } = useAsked<boolean>()
  return (
    <AdaptiveDialog open={open} onClose={() => answer()}>
      <DialogTitle>{title ?? t('title')}</DialogTitle>

      {!!description && (
        <DialogContent>
          <DialogContentText>{description}</DialogContentText>
        </DialogContent>
      )}

      <DialogActions>
        <Button onClick={() => answer()} color="primary">
          {cancelText ?? t('cancelText')}
        </Button>
        <Button
          onClick={() => answer(true)}
          color="primary"
          variant="contained"
          autoFocus
        >
          {okText ?? t('okText')}
        </Button>
      </DialogActions>
    </AdaptiveDialog>
  )
}
