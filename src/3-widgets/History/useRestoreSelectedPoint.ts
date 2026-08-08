import { useTranslation } from 'react-i18next'
import { useConfirm } from '6-shared/ui/SmartConfirm'
import { useSnackbar } from '6-shared/ui/SnackbarProvider'
import { useAppDispatch, useAppSelector } from 'store'
import { restoreOutboxPosition } from 'store/data'
import {
  exitHistoryBrowsing,
  selectHistoryPointData,
  selectSelectedHistoryPoint,
} from 'store/history'
import { core } from 'zerro-core/redux'

/**
 * Restoring the selected point, for whichever surface offers it.
 *
 * The panel and the top bar both need this and must not drift: a local point
 * is undone rather than diffed (nothing was ever sent, so there is nothing to
 * overwrite), a server point goes through confirmation and an ordinary restore
 * command. Two copies of that rule would be two chances to get it wrong.
 */
export function useRestoreSelectedPoint() {
  const { t } = useTranslation('history')
  const dispatch = useAppDispatch()
  const snackbar = useSnackbar()
  const point = useAppSelector(selectSelectedHistoryPoint)
  const data = useAppSelector(selectHistoryPointData)

  const restoreServer = () => {
    if (!data) return
    const applied = dispatch(core.restore.apply(data))
    dispatch(exitHistoryBrowsing())
    snackbar({ message: applied ? t('restoreApplied') : t('restoreNoChanges') })
  }
  const confirmRestoreServer = useConfirm({
    title: t('restorePoint'),
    description: t('restoreServerDescription'),
    okText: t('restorePoint'),
    onOk: restoreServer,
  })

  return {
    /** `data` is the single readiness signal: a local point out of range and a
     * journal point still loading or missing all leave it undefined. */
    canRestore: point !== null && data !== undefined,
    restore: () => {
      if (point === null) return
      if (point.kind !== 'local') return confirmRestoreServer()
      dispatch(restoreOutboxPosition(point.index))
      dispatch(exitHistoryBrowsing())
    },
  }
}
