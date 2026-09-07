import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { continueSyncLater, retryStoppedSync } from '@/4-features/sync'
import { Button, IconButton } from '@/6-shared/ui/Button'
import { AdaptiveDialog } from '@/6-shared/ui/AdaptiveDialog'
import {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@/6-shared/ui/Dialog'
import { CloseIcon } from '@/6-shared/ui/Icons'
import { RadialProgress } from '@/6-shared/ui/RadialProgress'
import { useAppDispatch, useAppSelector } from '@/store'
import {
  selectSyncDetailsOpen,
  selectSyncProgress,
  syncDetailsClosed,
  type TSyncProgress,
} from '@/store/sync'

export function SyncProgressDialog() {
  const progress = useAppSelector(selectSyncProgress)
  const open = useAppSelector(selectSyncDetailsOpen)
  const dispatch = useAppDispatch()
  if (!progress) return null
  return (
    <SyncProgressDialogView
      progress={progress}
      open={open}
      onClose={() => dispatch(syncDetailsClosed())}
      onRetry={() => void dispatch(retryStoppedSync())}
      onContinue={() => dispatch(continueSyncLater())}
    />
  )
}

export function SyncProgressDialogView({
  progress,
  open,
  onClose,
  onRetry,
  onContinue,
}: {
  progress: TSyncProgress
  open: boolean
  onClose: () => void
  onRetry: () => void
  onContinue: () => void
}) {
  const { t } = useTranslation(['syncProgress', 'settings', 'common'])
  const phase = progress.kind === 'stopped' ? 'stopped' : progress.phase
  const seconds = useRetrySeconds(
    progress.kind === 'pushing' ? progress.retryAt : null
  )
  const title =
    phase === 'sending'
      ? t('syncProgress:sendingTitle')
      : phase === 'waiting'
        ? t('syncProgress:waitingTitle')
        : t('syncProgress:stoppedTitle')
  const current = progress.rows.find(row => row.confirmed < row.total)
  const error =
    progress.errorStatus === 504
      ? t('syncProgress:gatewayTimeoutError')
      : progress.errorMessage

  return (
    <AdaptiveDialog
      open={open}
      onClose={onClose}
      aria-labelledby="sync-progress-title"
      className="w-full"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 pr-3">
        <DialogTitle id="sync-progress-title" className="min-w-0 pr-0">
          {title}
        </DialogTitle>
        <IconButton edge="end" aria-label={t('common:close')} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </div>
      <DialogContent className="pt-0">
        {phase === 'sending' && (
          <DialogContentText>
            {t('syncProgress:sendingDescription')}
          </DialogContentText>
        )}
        {phase === 'waiting' && (
          <DialogContentText>
            {t('syncProgress:waitingDescription', {
              count: seconds,
              error,
            })}
          </DialogContentText>
        )}
        {phase === 'stopped' && (
          <DialogContentText>
            {t('syncProgress:stoppedDescription', {
              entity: current ? entityLabel(t, current.key) : '',
              error,
            })}
          </DialogContentText>
        )}

        <ul className="m-0 mt-5 grid list-none gap-3 p-0">
          {progress.rows.map(row => (
            <li
              key={row.key}
              className="flex items-center gap-3"
              role="progressbar"
              aria-label={entityLabel(t, row.key)}
              aria-valuemin={0}
              aria-valuemax={row.total}
              aria-valuenow={row.confirmed}
            >
              <RadialProgress
                aria-hidden
                size={24}
                value={row.confirmed / row.total}
                active={phase === 'sending' && current?.key === row.key}
              />
              <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 text-body">
                <span>{entityLabel(t, row.key)}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {t('syncProgress:count', {
                    confirmed: row.confirmed,
                    total: row.total,
                  })}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </DialogContent>
      {phase === 'stopped' && (
        <DialogActions>
          <Button variant="text" color="secondary" onClick={onContinue}>
            {t('syncProgress:continueLater')}
          </Button>
          <Button variant="contained" onClick={onRetry}>
            {t('syncProgress:retryNow')}
          </Button>
        </DialogActions>
      )}
    </AdaptiveDialog>
  )
}

function useRetrySeconds(retryAt: number | null): number {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    if (retryAt === null) return
    const update = () =>
      setSeconds(Math.max(0, Math.ceil((retryAt - Date.now()) / 1000)))
    const initial = setTimeout(update, 0)
    const timer = setInterval(update, 250)
    return () => {
      clearTimeout(initial)
      clearInterval(timer)
    }
  }, [retryAt])
  return retryAt === null ? 0 : seconds
}

function entityLabel(
  t: (...args: any[]) => unknown,
  key: TSyncProgress['rows'][number]['key']
): string {
  return String(t(`settings:entity_${key === 'user' ? 'userSettings' : key}`))
}
