import { SnackbarNotice } from '6-shared/ui/SnackbarNotice'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from 'store'
import { getPersistenceWarning } from 'store/data'

/** Non-blocking: Redux stays authoritative for this session after an IDB write fails. */
export function PersistenceWarningNotice() {
  const { t } = useTranslation('settings')
  const reason = useAppSelector(getPersistenceWarning)
  if (!reason) return null

  return (
    <SnackbarNotice severity="warning" position="bottom-center">
      {t('persistenceWarning')}
    </SnackbarNotice>
  )
}
