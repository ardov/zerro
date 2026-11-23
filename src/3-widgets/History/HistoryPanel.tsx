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
  selectSelectedHistoryPoint,
  type THistoryPointRef,
} from '@/store/history'
import { HistoryControls } from './HistoryControls'
import { HistoryRestorePreview } from './HistoryRestorePreview'
import { HistoryRowList } from './HistoryRowList'

/** Use an overlay because layout breakpoints track the viewport, not the space left by a side panel. */
export const historyPanelScreen = defineScreen<true>('historyPanel')

export function HistoryPanel() {
  const { t } = useTranslation('history')
  const [opened, setOpened] = historyPanelScreen.use()
  return (
    <DrawerSurface
      title={t('panelTitle')}
      controller={{ open: !!opened, setOpen: next => !next && setOpened(null) }}
      className="w-95"
      contentScrolls
    >
      <HistoryPanelContent />
    </DrawerSurface>
  )
}

function HistoryPanelContent() {
  const { t } = useTranslation('history')
  const dispatch = useAppDispatch()
  const rows = useAppSelector(selectHistoryRows)
  const canLoadOlder = useAppSelector(selectCanLoadOlderHistory)
  const pageStatus = useAppSelector(selectHistoryPageStatus)
  const selected = useAppSelector(selectHighlightedHistoryPoint)
  const head = useAppSelector(selectHistoryHeadPoint)
  const restorePoint = useAppSelector(selectSelectedHistoryPoint)

  useEffect(() => {
    if (pageStatus === 'idle') {
      void dispatch(loadHistoryPage({ replace: true }))
    }
  }, [dispatch, pageStatus])

  const select = (point: THistoryPointRef) => {
    void dispatch(selectHistoryPoint(point))
  }

  return (
    <>
      <hr className="m-0 mt-3 border-0 border-t border-ui-border" />
      <HistoryControls />
      <hr className="m-0 border-0 border-t border-ui-border" />
      {rows.length === 0 ? (
        <EmptyHistory loading={pageStatus === 'loading'} />
      ) : (
        <ScrollArea
          className="grow"
          insetBottom={restorePoint ? '0px' : undefined}
        >
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
      <HistoryRestorePreview />
    </>
  )
}

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
