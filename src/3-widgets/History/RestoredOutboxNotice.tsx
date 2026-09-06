import { Button, IconButton } from '@/6-shared/ui/Button'
import { useCallback, useState } from 'react'
import { SnackbarNotice } from '@/6-shared/ui/SnackbarNotice'
import { useTranslation } from 'react-i18next'
import { CloseIcon } from '@/6-shared/ui/Icons'
import { syncData } from '@/4-features/sync'
import { useAppDispatch, useAppSelector } from '@/store'
import {
  getChangedNum,
  getJournalRecoveryRequired,
  getRestoredOutboxCount,
} from '@/store/data'

/**
 * Says that an outbox survived the reload, and offers the push that clears it.
 *
 * Pull-only sync is what makes this necessary: nothing pushes on its own any
 * more, so unsent commands can sit through a reload with no sign of it beyond
 * a badge on the sync button.
 */
export const RestoredOutboxNotice = () => {
  const { t } = useTranslation('history')
  const dispatch = useAppDispatch()
  const restoredCount = useAppSelector(getRestoredOutboxCount)
  const pendingCount = useAppSelector(getChangedNum)
  const recoveryRequired = useAppSelector(getJournalRecoveryRequired)
  const [dismissed, setDismissed] = useState(false)

  const handleSync = useCallback(() => {
    void dispatch(syncData())
  }, [dispatch])

  // Journal recovery holds the same corner and has to be resolved first; a
  // pending outbox is a normal state, not a fault.
  if (recoveryRequired) return null
  // `pendingCount` too: undoing the restored commands answers the notice as
  // well as sending them does.
  if (dismissed || !restoredCount || !pendingCount) return null

  return (
    <SnackbarNotice
      severity="info"
      title={t('restoredOutboxTitle')}
      action={
        <>
          <Button color="inherit" size="small" onClick={handleSync}>
            {t('sendChanges')}
          </Button>
          <IconButton
            color="inherit"
            size="small"
            aria-label={t('dismissNotice')}
            onClick={() => setDismissed(true)}
          >
            <CloseIcon size={20} />
          </IconButton>
        </>
      }
    >
      {t('restoredOutboxDescription', { count: pendingCount })}
    </SnackbarNotice>
  )
}
