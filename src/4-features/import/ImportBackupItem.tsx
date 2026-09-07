import { Button } from '@/6-shared/ui/Button'
import type { ChangeEvent } from 'react'
import { useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@/6-shared/ui/Dialog'
import { ActionListItem } from '@/6-shared/ui/ActionList'
import { ListRowIcon, ListRowText } from '@/6-shared/ui/ListRow'
import { UploadIcon } from '@/6-shared/ui/Icons'
import {
  byLabelKey,
  entityLabelKeys,
} from '@/6-shared/localization/entityLabels'
import { useSnackbar } from '@/6-shared/ui/SnackbarProvider'
import { track } from '@/6-shared/analytics'
import { parseFullBackup } from '@/6-shared/api/zm-adapter'
import type { TFullBackupWarning } from '@/6-shared/api/zm-adapter'
import type { TDataStore } from '@/6-shared/types'
import { useAppDispatch } from '@/store'
import { resetData } from '@/store/data'
import type { core } from '@/zerro-core/redux'
import { clearLocalData } from '@/4-features/localData'
import { useAsk, useAsked } from '@/6-shared/overlays'
import { Confirm } from '@/6-shared/ui/Confirm'

import {
  checkBackupCompatibility,
  importBackup,
  previewBackup,
} from './importBackup'

type TPending = {
  store: TDataStore
  summary: core.restore.TStoreDiffSummary
  foreign: boolean
  warnings: TFullBackupWarning[]
}

const noop = () => {}

/**
 * Restores the state a backup file describes. The confirmation is not
 * decoration: an import overwrites whatever changed since the backup, so the
 * user sees the size of that before anything is written.
 */
export function ImportBackupItem({ onClose = noop }: { onClose?: () => void }) {
  const { t } = useTranslation('settings')
  const dispatch = useAppDispatch()
  const snackbar = useSnackbar()
  const inputRef = useRef<HTMLInputElement>(null)

  const reloadData = useCallback(async () => {
    track('local_data_reload_requested', {})
    dispatch(resetData())
    await dispatch(clearLocalData())
    window.location.reload()
  }, [dispatch])
  const ask = useAsk()
  const confirmReload = useCallback(async () => {
    const confirmed = await ask(
      <Confirm
        title={t('invalidCurrentStateTitle')}
        description={t('invalidCurrentStateDescription')}
        okText={t('invalidCurrentStateConfirm')}
      />
    )
    if (!confirmed) return
    reloadData()
  }, [ask, reloadData, t])

  const handleFile = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      // Reset first, so picking the same file again still fires a change.
      event.target.value = ''
      if (!file) return

      let text: string
      try {
        text = await file.text()
      } catch {
        snackbar({ message: t('importError_unreadable') })
        return
      }

      const parsed = parseFullBackup(text)
      if (!parsed.ok) {
        snackbar({ message: t(`importError_${parsed.reason}`) })
        return
      }

      const compatibility = dispatch(checkBackupCompatibility(parsed.store))
      if (!compatibility.ok) {
        if (compatibility.reason === 'invalidCurrentState') {
          confirmReload()
          return
        }
        snackbar({ message: t(`importError_${compatibility.reason}`) })
        return
      }

      const summary = dispatch(previewBackup(parsed.store))
      if (!Object.keys(summary).length && !parsed.warnings.length) {
        snackbar({ message: t('importNoChanges') })
        return
      }
      const pending: TPending = {
        store: parsed.store,
        summary,
        foreign: compatibility.foreign,
        warnings: parsed.warnings,
      }
      onClose()
      const confirmed = await ask<boolean>(
        <BackupImportDialog pending={pending} />
      )
      if (!confirmed) return

      const result = dispatch(importBackup(pending.store))
      if (!result.ok) {
        if (result.reason === 'invalidCurrentState') {
          confirmReload()
          return
        }
        snackbar({ message: t(`importError_${result.reason}`) })
      } else {
        snackbar({
          message: t(result.applied ? 'importDone' : 'importNoChanges'),
        })
      }
    },
    [ask, confirmReload, dispatch, onClose, snackbar, t]
  )

  return (
    <>
      <ActionListItem onClick={() => inputRef.current?.click()}>
        <ListRowIcon>
          <UploadIcon />
        </ListRowIcon>
        <ListRowText>{t('restoreFromBackup')}</ListRowText>
      </ActionListItem>

      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={handleFile}
      />
    </>
  )
}

function BackupImportDialog({ pending }: { pending: TPending }) {
  const { t } = useTranslation('settings')
  const { open, answer } = useAsked<boolean>()
  return (
    <Dialog open={open} onClose={() => answer()}>
      <DialogTitle>{t('importTitle')}</DialogTitle>
      <DialogContent>
        {pending.foreign && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-error-border bg-error-surface p-3"
          >
            <p className="m-0 text-body-sm">{t('importForeignWarning')}</p>
          </div>
        )}
        {!!pending.warnings.length && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-warning-border bg-warning-surface p-3"
          >
            <p className="m-0 text-body-sm">
              {t('importCompatibilityWarning')}
            </p>
            <ul className="mb-0 mt-2 pl-5 text-body-sm">
              {pending.warnings.map(warning => (
                <li key={`${warning.reason}:${warning.path}`}>
                  {t('importCompatibilityWarningItem', {
                    path: warning.path,
                    count: warning.count,
                  })}
                </li>
              ))}
            </ul>
          </div>
        )}
        <DialogContentText>{t('importWarning')}</DialogContentText>
        <div className="mt-4 flex flex-col gap-1">
          {entityLabelKeys.map(([key, labelKey]) => {
            const counts = byLabelKey(pending.summary)[key]
            if (!counts) return null
            return (
              <div key={key} className="flex justify-between gap-4">
                <span className="text-body-sm">{t(labelKey)}</span>
                <span className="text-body-sm text-muted-foreground">
                  {[
                    counts.created && t('importCreated', { n: counts.created }),
                    counts.updated && t('importUpdated', { n: counts.updated }),
                    counts.removed && t('importRemoved', { n: counts.removed }),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </div>
            )
          })}
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => answer()}>{t('importCancel')}</Button>
        <Button onClick={() => answer(true)} variant="contained" autoFocus>
          {t(pending.warnings.length ? 'importConfirmAnyway' : 'importConfirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
