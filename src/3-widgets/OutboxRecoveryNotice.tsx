import { Button } from '6-shared/ui/Button'
import { useCallback } from 'react'
import { SnackbarNotice } from '6-shared/ui/SnackbarNotice'
import { useTranslation } from 'react-i18next'
import { discardCorruptOutbox } from '4-features/localData'
import { useAsk } from '6-shared/overlays'
import { Confirm } from '6-shared/ui/Confirm'
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
  const ask = useAsk()
  const confirmDiscard = async () => {
    const confirmed = await ask(
      <Confirm
        title={t('outboxRecoveryTitle')}
        description={t('outboxRecoveryDescription')}
        okText={t('outboxRecoveryConfirm')}
      />
    )
    if (!confirmed) return
    handleDiscard()
  }

  if (!reason) return null

  return (
    <SnackbarNotice
      severity="error"
      title={t('outboxRecoveryTitle')}
      action={
        <Button color="inherit" size="small" onClick={confirmDiscard}>
          {t('outboxRecoveryConfirm')}
        </Button>
      }
    >
      {t('outboxRecoveryDescription')}
      <div className="mt-2 break-words font-mono type-caption">
        {t('journalRecoveryDiagnostic')}: {reason}
      </div>
    </SnackbarNotice>
  )
}
