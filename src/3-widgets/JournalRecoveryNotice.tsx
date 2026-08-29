import { Button } from '6-shared/ui/Button'
import { useCallback } from 'react'
import { SnackbarNotice } from '6-shared/ui/SnackbarNotice'
import { useTranslation } from 'react-i18next'
import { reloadData } from '4-features/sync'
import { useConfirm } from '6-shared/ui/SmartConfirm'
import { useAppDispatch, useAppSelector } from 'store'
import {
  getJournalRecoveryReason,
  getJournalRecoveryRequired,
  getOutboxRecoveryReason,
} from 'store/data'

/** Persistent recovery prompt for a semantically invalid accepted branch. */
export const JournalRecoveryNotice = () => {
  const { t } = useTranslation('settings')
  const dispatch = useAppDispatch()
  const recoveryRequired = useAppSelector(getJournalRecoveryRequired)
  const recoveryReason = useAppSelector(getJournalRecoveryReason)
  const outboxRecoveryReason = useAppSelector(getOutboxRecoveryReason)
  const handleReload = useCallback(() => {
    void dispatch(reloadData())
  }, [dispatch])
  const confirmReload = useConfirm({
    title: t('journalRecoveryTitle'),
    description: t('journalRecoveryDescription'),
    okText: t('journalRecoveryConfirm'),
    onOk: handleReload,
  })

  if (!recoveryRequired || outboxRecoveryReason !== null) return null

  return (
    <SnackbarNotice
        severity="error"
        title={t('journalRecoveryTitle')}
        action={
          <Button color="inherit" size="small" onClick={confirmReload}>
            {t('journalRecoveryConfirm')}
          </Button>
        }
      >
        {t('journalRecoveryDescription')}
        {recoveryReason && (
          <div className="mt-2 break-words font-mono type-caption">
            {t('journalRecoveryDiagnostic')}: {recoveryReason}
          </div>
        )}
    </SnackbarNotice>
  )
}
