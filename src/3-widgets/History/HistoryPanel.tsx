import { Button } from '@/6-shared/ui/kit/Button'
import { useEffect } from 'react'
import { DrawerSurface } from '@/6-shared/ui/kit/Drawer'
import { ScrollArea } from '@/6-shared/ui/kit/ScrollArea'
import { useTranslation } from 'react-i18next'
import { HistoryIcon } from '@/6-shared/ui/Icons'
import { defineScreen } from '@/6-shared/overlays'
import { useAppDispatch, useAppSelector } from '@/store'
import {
  selectHistoryRows,
  loadHistoryPage,
  selectCanLoadOlderHistory,
  selectHistoryPageStatus,
  selectHistoryHeadPoint,
  selectHighlightedHistoryPoint,
  selectHistoryPoint,
  type THistoryPointRef,
} from '@/store/history'
import { HistoryControls } from './HistoryControls'
import { HistoryRestorePreview } from './HistoryRestorePreview'
import { HistoryRowList } from './HistoryRowList'

/**
 * An overlay on every size, not a column beside the page.
 *
 * It was a persistent drawer so history could be browsed next to the live app,
 * but the layout breakpoints watch the viewport rather than the space left
 * over: giving the panel 380px shrank the content box without moving the
 * layout to its narrower form, so the budget table collapsed to bare icons
 * behind a horizontal scrollbar. Overlaying costs nothing that was working.
 */
/** A screen: it holds nothing but its own presence, and comes back from Back,
 * Forward and a reload alike. Opening it from the settings menu takes the
 * menu's place rather than stacking on it — a screen opened while popups are
 * alive replaces them, so nothing here has to say so. */
export const historyPanelScreen = defineScreen<true>('historyPanel')

export function HistoryPanel() {
  const { t } = useTranslation('history')
  const dispatch = useAppDispatch()
  const [opened, setOpened] = historyPanelScreen.use()
  const open = !!opened
  const rows = useAppSelector(selectHistoryRows)
  const canLoadOlder = useAppSelector(selectCanLoadOlderHistory)
  const pageStatus = useAppSelector(selectHistoryPageStatus)
  // Marks the head row while the panel is open, so stepping never leaves the
  // list without a "you are here".
  const selected = useAppSelector(selectHighlightedHistoryPoint)
  const head = useAppSelector(selectHistoryHeadPoint)

  useEffect(() => {
    if (open && pageStatus === 'idle') {
      void dispatch(loadHistoryPage({ replace: true }))
    }
  }, [dispatch, open, pageStatus])

  const select = (point: THistoryPointRef) => {
    void dispatch(selectHistoryPoint(point))
  }

  return (
    <DrawerSurface
      title={t('panelTitle')}
      controller={{ open, setOpen: next => !next && setOpened(null) }}
      className="w-95"
      contentScrolls
    >
      <hr className="m-0 mt-3 border-0 border-t border-ui-border" />
      <HistoryControls />
      <hr className="m-0 border-0 border-t border-ui-border" />
      {rows.length === 0 ? (
        <EmptyHistory loading={pageStatus === 'loading'} />
      ) : (
        <ScrollArea className="grow">
          <HistoryRowList
            rows={rows}
            selected={selected}
            head={head}
            onSelect={select}
          />
          {canLoadOlder && (
            <Button
              variant="ghost"
              size="sm"
              disabled={pageStatus === 'loading'}
              onClick={() => void dispatch(loadHistoryPage())}
              className="w-full my-2"
            >
              {t('loadOlder')}
            </Button>
          )}
        </ScrollArea>
      )}
      {/* Pinned under the list: it belongs to the selection, not to the row
          that happens to be scrolled into view. */}
      <HistoryRestorePreview />
    </DrawerSurface>
  )
}

/** Centred rather than a line of text at the top: an empty full-screen sheet
 * with one sentence pinned to its ceiling reads as a failure to load. */
function EmptyHistory({ loading }: { loading: boolean }) {
  const { t } = useTranslation('history')
  return (
    <div className="flex grow flex-col items-center justify-center gap-2 px-8 text-center text-ui-secondary">
      <HistoryIcon className="size-10 opacity-40" />
      <p className="m-0 text-body-sm">
        {loading ? t('historyLoading') : t('noHistory')}
      </p>
      {!loading && (
        <p className="m-0 text-caption opacity-80">{t('noHistoryHint')}</p>
      )}
    </div>
  )
}
