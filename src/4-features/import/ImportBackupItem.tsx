import type { ChangeEvent } from 'react'
import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material'
import { UploadIcon } from '6-shared/ui/Icons'
import { useSnackbar } from '6-shared/ui/SnackbarProvider'
import type { TDataStore } from '6-shared/types'
import { useAppDispatch } from 'store'
import type { core } from 'zerro-core/redux'

import { importBackup, parseBackup, previewBackup } from './importBackup'

/** Display order of the summary, and the only entity types it can carry. */
const entityLabels = [
  ['account', 'entity_account'],
  ['tag', 'entity_tag'],
  ['merchant', 'entity_merchant'],
  ['budget', 'entity_budget'],
  ['reminder', 'entity_reminder'],
  ['transaction', 'entity_transaction'],
] as const

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

  const handleFile = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      // Reset first, so picking the same file again still fires a change.
      event.target.value = ''
      if (!file) return

      const parsed = parseBackup(await file.text())
      if (!parsed.ok) {
        snackbar({ message: t(`importError_${parsed.reason}`) })
        return
      }

      const summary = dispatch(previewBackup(parsed.store))
      if (!Object.keys(summary).length) {
        snackbar({ message: t('importNoChanges') })
        return
      }
      setPending({ store: parsed.store, summary })
    },
    [dispatch, snackbar, t]
  )

  const handleConfirm = useCallback(() => {
    if (!pending) return
    dispatch(importBackup(pending.store))
    setPending(null)
    snackbar({ message: t('importDone') })
  }, [dispatch, pending, snackbar, t])

  return (
    <>
      <MenuItem onClick={() => inputRef.current?.click()}>
        <ListItemIcon>
          <UploadIcon />
        </ListItemIcon>
        <ListItemText>{t('restoreFromBackup')}</ListItemText>
      </MenuItem>

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
          <Stack spacing={0.5} sx={{ mt: 2 }}>
            {entityLabels.map(([key, labelKey]) => {
              const counts = pending?.summary[key]
              if (!counts) return null
              return (
                <Box
                  key={key}
                  sx={{
                    display: 'flex',
                    gap: 2,
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography variant="body2">{t(labelKey)}</Typography>
                  <Typography variant="body2" color="text.secondary">
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
                  </Typography>
                </Box>
              )
            })}
          </Stack>
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
