import { useEffect } from 'react'
import type { Theme } from '@mui/material'
import { Button, Drawer, IconButton, useMediaQuery } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { CloseIcon, HistoryIcon } from '6-shared/ui/Icons'
import { registerPopover } from '6-shared/historyPopovers'
import { useAppDispatch, useAppSelector } from 'store'
import {
  selectHistoryRows,
  loadHistoryPage,
  selectCanLoadOlderHistory,
  selectHistoryPageStatus,
  selectHistoryHeadPoint,
  selectHighlightedHistoryPoint,
  selectHistoryPoint,
  type THistoryPointRef,
} from 'store/history'
import { HistoryControls } from './HistoryControls'
import { HistoryRestorePreview } from './HistoryRestorePreview'
import { HistoryRowList } from './HistoryRowList'

const panelWidth = 380

/**
 * An overlay on every size, not a column beside the page.
 *
 * It was a persistent drawer so history could be browsed next to the live app,
 * but the app's own breakpoints watch the viewport rather than the space left
 * over: giving the panel 380px shrank the content box without moving the
 * layout to its narrower form, so the budget table collapsed to bare icons
 * behind a horizontal scrollbar. Overlaying costs nothing that was working.
 */
export const historyPanelPopover = registerPopover<object, object>(
  'historyPanel',
  {}
)

/** Opens the panel from a menu, taking the screen over from it in one step. */
export function useHistoryPanelFromMenu() {
  const { openReplacing } = historyPanelPopover.useMethods()
  return () => openReplacing({})
}

export function HistoryPanel() {
  const { t } = useTranslation('history')
  const dispatch = useAppDispatch()
  const isMobile = useMediaQuery<Theme>(theme => theme.breakpoints.down('md'))
  const { displayProps } = historyPanelPopover.useProps()
  const rows = useAppSelector(selectHistoryRows)
  const canLoadOlder = useAppSelector(selectCanLoadOlderHistory)
  const pageStatus = useAppSelector(selectHistoryPageStatus)
  // Marks the head row while the panel is open, so stepping never leaves the
  // list without a "you are here".
  const selected = useAppSelector(selectHighlightedHistoryPoint)
  const head = useAppSelector(selectHistoryHeadPoint)

  useEffect(() => {
    if (displayProps.open && pageStatus === 'idle') {
      void dispatch(loadHistoryPage({ replace: true }))
    }
  }, [dispatch, displayProps.open, pageStatus])

  const select = (point: THistoryPointRef) => {
    void dispatch(selectHistoryPoint(point))
  }

  return (
    <Drawer
      anchor="right"
      variant="temporary"
      open={displayProps.open}
      onClose={displayProps.onClose}
      slotProps={{
        paper: { sx: { width: isMobile ? '100%' : panelWidth } },
      }}
    >
      <div className="flex items-center justify-between px-4 py-2">
        <h2 className="m-0 text-xl leading-[1.6] font-medium">
          {t('panelTitle')}
        </h2>
        <IconButton
          size="small"
          onClick={displayProps.onClose}
          aria-label={t('closePanel')}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>
      <hr className="m-0 border-0 border-t border-border" />
      <HistoryControls />
      <hr className="m-0 border-0 border-t border-border" />
      {rows.length === 0 ? (
        <EmptyHistory loading={pageStatus === 'loading'} />
      ) : (
        <div className="grow overflow-y-auto">
          <HistoryRowList
            rows={rows}
            selected={selected}
            head={head}
            onSelect={select}
          />
          {canLoadOlder && (
            <Button
              fullWidth
              disabled={pageStatus === 'loading'}
              onClick={() => void dispatch(loadHistoryPage())}
              className="my-2"
            >
              {t('loadOlder')}
            </Button>
          )}
        </div>
      )}
      {/* Pinned under the list: it belongs to the selection, not to the row
          that happens to be scrolled into view. */}
      <HistoryRestorePreview />
    </Drawer>
  )
}

/** Centred rather than a line of text at the top: an empty full-screen sheet
 * with one sentence pinned to its ceiling reads as a failure to load. */
function EmptyHistory({ loading }: { loading: boolean }) {
  const { t } = useTranslation('history')
  return (
    <div className="flex grow flex-col items-center justify-center gap-2 px-8 text-center text-muted-foreground">
      <HistoryIcon className="text-[40px] opacity-40" />
      <p className="m-0 text-sm leading-[1.43]">
        {loading ? t('historyLoading') : t('noHistory')}
      </p>
      {!loading && (
        <p className="m-0 text-xs leading-[1.66] opacity-80">
          {t('noHistoryHint')}
        </p>
      )}
    </div>
  )
}
