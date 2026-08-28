import { Button } from '6-shared/ui/Button'
import type { ChangeEvent } from 'react'
import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material'
import {
  ActionListItem,
  ActionListItemIcon,
  ActionListItemText,
} from '6-shared/ui/ActionList'
import { UploadIcon } from '6-shared/ui/Icons'
import { byLabelKey, entityLabelKeys } from '6-shared/localization/entityLabels'
import { useSnackbar } from '6-shared/ui/SnackbarProvider'
import { track } from '6-shared/analytics'
import { parseFullBackup } from '6-shared/api/zm-adapter'
import type { TDataStore } from '6-shared/types'
import { useAppDispatch } from 'store'
import { resetData } from 'store/data'
import type { core } from 'zerro-core/redux'
import { clearLocalData } from '4-features/localData'
import { useConfirm } from '6-shared/ui/SmartConfirm'

import {
  checkBackupCompatibility,
  importBackup,
  previewBackup,
} from './importBackup'

type TPending = {
  store: TDataStore
  summary: core.restore.TStoreDiffSummary
}

/**
 * Restores the state a backup file describes. The confirmation is not
 * decoration: an import overwrites whatever changed since the backup, so the
 * user sees the size of that before anything is written.
 */
export function ImportBackupItem() {
  const { t } = useTranslation('settings')
  const dispatch = useAppDispatch()
  const snackbar = useSnackbar()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<TPending | null>(null)

  const reloadData = useCallback(async () => {
    track('local_data_reload_requested', {})
    dispatch(resetData())
    await dispatch(clearLocalData())
    window.location.reload()
  }, [dispatch])
  const confirmReload = useConfirm({
    title: t('invalidCurrentStateTitle'),
    description: t('invalidCurrentStateDescription'),
    okText: t('invalidCurrentStateConfirm'),
    onOk: reloadData,
  })

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
      if (!Object.keys(summary).length) {
        snackbar({ message: t('importNoChanges') })
        return
      }
      setPending({ store: parsed.store, summary })
    },
    [confirmReload, dispatch, snackbar, t]
  )

  const handleConfirm = useCallback(() => {
    if (!pending) return
    const result = dispatch(importBackup(pending.store))
    setPending(null)
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
  }, [confirmReload, dispatch, pending, snackbar, t])

  return (
    <>
      <ActionListItem onClick={() => inputRef.current?.click()}>
        <ActionListItemIcon>
          <UploadIcon />
        </ActionListItemIcon>
        <ActionListItemText>{t('restoreFromBackup')}</ActionListItemText>
      </ActionListItem>

      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={handleFile}
      />

      <Dialog open={!!pending} onClose={() => setPending(null)}>
        <DialogTitle>{t('importTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('importWarning')}</DialogContentText>
          <div className="mt-4 flex flex-col gap-1">
            {entityLabelKeys.map(([key, labelKey]) => {
              const counts = byLabelKey(pending?.summary)[key]
              if (!counts) return null
              return (
                <div key={key} className="flex justify-between gap-4">
                  <span className="type-body-sm">{t(labelKey)}</span>
                  <span className="type-body-sm text-muted-foreground">
                    {[
                      counts.created &&
                        t('importCreated', { n: counts.created }),
                      counts.updated &&
                        t('importUpdated', { n: counts.updated }),
                      counts.removed &&
                        t('importRemoved', { n: counts.removed }),
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
          <Button onClick={() => setPending(null)}>{t('importCancel')}</Button>
          <Button onClick={handleConfirm} variant="contained" autoFocus>
            {t('importConfirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
