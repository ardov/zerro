import { useCallback, useState } from 'react'
import type { PopoverProps } from '@mui/material'
import { Box, Button, Divider, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { AdaptivePopover } from '6-shared/ui/AdaptivePopover'
import { registerPopover } from '6-shared/historyPopovers'
import { useAppDispatch, useAppSelector } from 'store'
import {
  selectLiveHistoryRows,
  selectHighlightedHistoryPoint,
  selectHistoryPoint,
  type THistoryPointRef,
} from 'store/history'
import { HistoryControls } from './HistoryControls'
import { HistoryRowList } from './HistoryRowList'
import { historyPanelPopover } from './HistoryPanel'

const previewPopover = registerPopover<object, PopoverProps>(
  'historyPreview',
  {}
)

/** Right-click / long-press on the sync button opens this: a window onto the
 * top of the same list the panel shows in full — just the live tail. */
export const useHistoryPreview = () => {
  const { open } = previewPopover.useMethods()
  return useCallback((anchorEl: HTMLElement) => open({}, { anchorEl }), [open])
}

export function HistoryPreview() {
  const { t } = useTranslation('history')
  const dispatch = useAppDispatch()
  const { displayProps, extraProps } = previewPopover.useProps()
  const { open: openPanel } = historyPanelPopover.useMethods()
  const rows = useAppSelector(selectLiveHistoryRows)
  const selected = useAppSelector(selectHighlightedHistoryPoint)

  // Masked locally rather than closed through `displayProps.onClose`: that
  // closes via a relative history step, which races the panel's own (History
  // API) push when both fire from the same click — whichever lands second
  // wins, and it's unpredictable which one that is. Leaving this popover
  // "open" underneath the panel is harmless once it's hidden; `extraProps` is
  // a fresh object on every `open()` call (see PopoverManager), including a
  // repeat open of an already-open popover, so it's a reliable unmask signal.
  const [expanding, setExpanding] = useState(false)
  const [maskedFor, setMaskedFor] = useState(extraProps)
  if (maskedFor !== extraProps) {
    setMaskedFor(extraProps)
    setExpanding(false)
  }

  const select = (point: THistoryPointRef) => {
    dispatch(selectHistoryPoint(point))
    displayProps.onClose()
  }
  const expand = () => {
    setExpanding(true)
    openPanel({})
  }

  return (
    <AdaptivePopover
      {...displayProps}
      open={displayProps.open && !expanding}
      anchor="bottom"
    >
      <Box sx={{ width: 320, maxWidth: '100vw' }}>
        <HistoryControls />
        <Divider />
        {rows.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
            {t('noPendingChanges')}
          </Typography>
        ) : (
          <Box sx={{ maxHeight: 320, overflowY: 'auto' }}>
            <HistoryRowList rows={rows} selected={selected} onSelect={select} />
          </Box>
        )}
        <Divider />
        <Button fullWidth onClick={expand}>
          {t('openPanel')}
        </Button>
      </Box>
    </AdaptivePopover>
  )
}
