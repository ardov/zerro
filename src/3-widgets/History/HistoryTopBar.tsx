import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { Theme } from '@mui/material'
import {
  Box,
  Button,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { formatDate } from '6-shared/helpers/date'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  HistoryIcon,
} from '6-shared/ui/Icons'
import { useConfirm } from '6-shared/ui/SmartConfirm'
import { useSnackbar } from '6-shared/ui/SnackbarProvider'
import { isEditingTarget } from '4-features/historyShortcuts'
import { useAppDispatch, useAppSelector } from 'store'
import { restoreOutboxPosition, validateJournalPoint } from 'store/data'
import {
  exitHistoryBrowsing,
  returnToCurrent,
  selectHistoryPoint,
  selectHistoryPointData,
  selectHistoryStep,
  selectIsBrowsingHistory,
  selectSelectedHistoryEntry,
  selectSelectedHistoryEntryMissing,
  selectSelectedHistoryPoint,
  selectSelectedHistoryTime,
} from 'store/history'
import { core } from 'zerro-core/redux'
import { dataStoreValidatorVersion } from 'zerro-core/replica'
import { historyPanelPopover } from './HistoryPanel'

/**
 * The transport for browsing history, open until the user explicitly leaves.
 *
 * Every control keeps its place and switches `disabled` rather than
 * unmounting: the bar pushes the page down, so a control that appears or
 * disappears as you step would shift what you are reading mid-click. For the
 * same reason no control changes meaning — stepping to the newest row disables
 * the forward arrow instead of closing the bar under the finger pressing it.
 */
export function HistoryTopBar() {
  const { t } = useTranslation('history')
  const dispatch = useAppDispatch()
  const snackbar = useSnackbar()
  const isNarrow = useMediaQuery<Theme>(theme => theme.breakpoints.down('sm'))
  const browsing = useAppSelector(selectIsBrowsingHistory)
  const point = useAppSelector(selectSelectedHistoryPoint)
  const data = useAppSelector(selectHistoryPointData)
  const missing = useAppSelector(selectSelectedHistoryEntryMissing)
  const time = useAppSelector(selectSelectedHistoryTime)
  const entry = useAppSelector(selectSelectedHistoryEntry)
  const step = useAppSelector(selectHistoryStep)
  const { displayProps: panel, open: openPanel } =
    historyPanelPopover.useProps()

  // Journal points validate lazily: only once opened, cached by validator version.
  useEffect(() => {
    if (point?.kind !== 'journal' || !entry) return
    const stale =
      entry.validation.kind === 'unknown' ||
      entry.validation.validatorVersion !== dataStoreValidatorVersion
    if (stale) dispatch(validateJournalPoint(point.ref))
  }, [dispatch, entry, point])

  // Escape leaves history. With ✕ it is the only way out, and both sit still.
  useEffect(() => {
    if (!browsing) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== 'Escape' ||
        event.defaultPrevented ||
        isEditingTarget(event.target)
      )
        return
      dispatch(exitHistoryBrowsing())
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [browsing, dispatch])

  const restoreLocal = () => {
    if (point?.kind !== 'local') return
    dispatch(restoreOutboxPosition(point.index))
    dispatch(exitHistoryBrowsing())
  }
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

  if (!browsing) return null

  // A null selection is the head of the list: live data under another name.
  const atHead = point === null
  const canRestore =
    !atHead &&
    !missing &&
    (point.kind === 'local' || entry?.validation.kind === 'valid')
  const restore = () =>
    point?.kind === 'local' ? restoreLocal() : confirmRestoreServer()

  const label = missing
    ? t('pointUnavailable')
    : time
      ? formatDate(time, 'd MMM yyyy, HH:mm')
      : t('currentState')

  return (
    <Box
      sx={{
        borderBottom: '2px solid',
        borderColor: atHead ? 'divider' : 'warning.main',
        bgcolor: 'background.paper',
        px: { xs: 1, sm: 2 },
        py: 0.5,
      }}
    >
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
        <IconButton
          size="small"
          disabled={!step.back}
          onClick={() => step.back && dispatch(selectHistoryPoint(step.back))}
          aria-label={t('stepBack')}
        >
          <ChevronLeftIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          disabled={!step.forward}
          onClick={() =>
            step.forward && dispatch(selectHistoryPoint(step.forward))
          }
          aria-label={t('stepForward')}
        >
          <ChevronRightIcon fontSize="small" />
        </IconButton>
        <Typography variant="caption" noWrap sx={{ flexGrow: 1, minWidth: 0 }}>
          {label}
        </Typography>
        <IconButton
          size="small"
          disabled={panel.open}
          onClick={() => openPanel({})}
          aria-label={t('openPanel')}
        >
          <HistoryIcon fontSize="small" />
        </IconButton>
        {/* The date is the only thing allowed to shrink: a label that wraps
            would make the bar two rows tall mid-step and shift the page. */}
        <Button
          size="small"
          sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}
          disabled={!canRestore}
          onClick={restore}
        >
          {isNarrow ? t('restoreShort') : t('restorePoint')}
        </Button>
        <Button
          size="small"
          sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}
          disabled={atHead}
          onClick={() => dispatch(returnToCurrent())}
        >
          {t('goToCurrent')}
        </Button>
        <IconButton
          size="small"
          onClick={() => dispatch(exitHistoryBrowsing())}
          aria-label={t('exitHistory')}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>
    </Box>
  )
}
