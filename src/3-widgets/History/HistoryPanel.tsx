import type { Theme } from '@mui/material'
import {
  Box,
  Divider,
  Drawer,
  IconButton,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { CloseIcon } from '6-shared/ui/Icons'
import { registerPopover } from '6-shared/historyPopovers'
import { useAppDispatch, useAppSelector } from 'store'
import {
  selectHistoryRows,
  selectHighlightedHistoryPoint,
  selectHistoryPoint,
  type THistoryPointRef,
} from 'store/history'
import { HistoryControls } from './HistoryControls'
import { HistoryRestorePreview } from './HistoryRestorePreview'
import { HistoryRowList } from './HistoryRowList'

const panelWidth = 380

/** Non-modal on desktop by design: this is a read-only projection you browse
 * next to the live app, not a dialog you finish and dismiss. */
export const historyPanelPopover = registerPopover<object, object>(
  'historyPanel',
  {}
)

/** How much room the open panel takes from the page. Zero on mobile, where it
 * is a full-screen sheet over the app rather than a column beside it. */
export function useHistoryPanelOffset() {
  const isMobile = useMediaQuery<Theme>(theme => theme.breakpoints.down('md'))
  const { displayProps } = historyPanelPopover.useProps()
  return !isMobile && displayProps.open ? panelWidth : 0
}

export function HistoryPanel() {
  const { t } = useTranslation('history')
  const dispatch = useAppDispatch()
  const isMobile = useMediaQuery<Theme>(theme => theme.breakpoints.down('md'))
  const { displayProps } = historyPanelPopover.useProps()
  const rows = useAppSelector(selectHistoryRows)
  // Marks the head row while the bar is open, so stepping never leaves the
  // list without a "you are here".
  const selected = useAppSelector(selectHighlightedHistoryPoint)

  const select = (point: THistoryPointRef) =>
    dispatch(selectHistoryPoint(point))

  return (
    <Drawer
      anchor="right"
      variant={isMobile ? 'temporary' : 'persistent'}
      open={displayProps.open}
      onClose={displayProps.onClose}
      slotProps={{
        paper: { sx: { width: isMobile ? '100%' : panelWidth } },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
        }}
      >
        <Typography variant="h6">{t('panelTitle')}</Typography>
        <IconButton
          size="small"
          onClick={displayProps.onClose}
          aria-label={t('closePanel')}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Divider />
      <HistoryControls />
      <Divider />
      {rows.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
          {t('noHistory')}
        </Typography>
      ) : (
        <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
          <HistoryRowList rows={rows} selected={selected} onSelect={select} />
        </Box>
      )}
      {/* Pinned under the list: it belongs to the selection, not to the row
          that happens to be scrolled into view. */}
      <HistoryRestorePreview />
    </Drawer>
  )
}
