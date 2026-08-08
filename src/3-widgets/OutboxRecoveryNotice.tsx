import { useCallback } from 'react'
import { Alert, AlertTitle, Button, Snackbar, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { discardCorruptOutbox } from '4-features/localData'
import { useConfirm } from '6-shared/ui/SmartConfirm'
import { useAppDispatch, useAppSelector } from 'store'
import { getOutboxRecoveryReason } from 'store/data'

/** Keeps a corrupt durable outbox untouched until the user explicitly discards
 * those unsynchronized commands. Canonical recovery waits behind this gate. */
export function OutboxRecoveryNotice() {
  const { t } = useTranslation('settings')
  const dispatch = useAppDispatch()
  const reason = useAppSelector(getOutboxRecoveryReason)
  const handleDiscard = useCallback(() => {
    void dispatch(discardCorruptOutbox()).catch(error =>
      console.error('Failed to discard corrupt local changes', error)
    )
  }, [dispatch])
  const confirmDiscard = useConfirm({
    title: t('outboxRecoveryTitle'),
    description: t('outboxRecoveryDescription'),
    okText: t('outboxRecoveryConfirm'),
    onOk: handleDiscard,
  })

  if (!reason) return null

  return (
    <Snackbar open anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
      <Alert
        severity="error"
        variant="filled"
        action={
          <Button color="inherit" size="small" onClick={confirmDiscard}>
            {t('outboxRecoveryConfirm')}
          </Button>
        }
      >
        <AlertTitle>{t('outboxRecoveryTitle')}</AlertTitle>
        {t('outboxRecoveryDescription')}
        <Typography
          component="div"
          variant="caption"
          sx={{ mt: 1, fontFamily: 'monospace', wordBreak: 'break-word' }}
        >
          {t('journalRecoveryDiagnostic')}: {reason}
        </Typography>
      </Alert>
    </Snackbar>
  )
}
