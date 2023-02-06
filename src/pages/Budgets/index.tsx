import React, { FC, ReactElement, useCallback } from 'react'
import { Redirect } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { Box, Drawer, Theme, useMediaQuery } from '@mui/material'
import { useHotkeys } from 'react-hotkeys-hook'
import { formatDate } from '@shared/helpers/date'
import { useCachedValue } from '@shared/hooks/useCachedValue'
import { useSearchParam } from '@shared/hooks/useSearchParam'
import { nextMonth, prevMonth, toISOMonth } from '@shared/helpers/date'
import { useMonth } from '@shared/hooks/useMonth'
import { TEnvelopeId } from '@entities/envelope'

import { balances } from '@entities/envBalances'
import { MonthInfo } from './MonthInfo'
import { EnvelopePreview } from './EnvelopePreview'
import {
  BudgetTransactionsDrawer,
  TrMode,
  useTrDrawer,
} from './TransactionsDrawer'
import { EnvelopeTable } from './EnvelopeTable'
import { DnDContext } from './DnDContext'
import { BudgetPopoverProvider } from './BudgetPopover'
import { GoalPopoverProvider } from './GoalPopover'
import { Explainer } from './Explainer'

export default function BudgetsRouter() {
  const [month] = useMonth()
  const monthList = balances.useMonthList()
  const minMonth = monthList[0]
  const maxMonth = monthList[monthList.length - 1]

  if (!month) {
    return <Redirect to={`/budget?month=${toISOMonth(new Date())}`} />
  }
  if (month < minMonth) {
    return <Redirect to={`/budget?month=${minMonth}`} />
  }
  if (month > maxMonth) {
    return <Redirect to={`/budget?month=${maxMonth}`} />
  }
  return <Budgets />
}

type TDrawerId = TEnvelopeId | 'overview'

function Budgets() {
  useMonthHotkeys()
  const [month] = useMonth()
  const [drawerId, setDrawerId] = useSearchParam<TDrawerId>('drawer')
  const { setDrawer } = useTrDrawer()
  const openOverview = useCallback(() => setDrawerId('overview'), [setDrawerId])
  const openEnvelopeInfo = useCallback(
    (id: TEnvelopeId | null) => setDrawerId(id),
    [setDrawerId]
  )
  const closeDrawer = useCallback(() => setDrawerId(), [setDrawerId])
  const openTransactions = useCallback(
    (opts: { id: TEnvelopeId; isExact?: boolean }) =>
      setDrawer({
        id: opts.id,
        month,
        mode: TrMode.Envelope,
        isExact: opts.isExact,
      }),
    [month, setDrawer]
  )

  const detailsContent = !drawerId ? undefined : drawerId === 'overview' ? (
    <MonthInfo onClose={closeDrawer} />
  ) : (
    <EnvelopePreview onClose={closeDrawer} id={drawerId} />
  )

  const sideDefault = <MonthInfo onClose={closeDrawer} />

  const mainContent = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        height: 'fit-content',
        gap: 2,
        width: '100%',
        maxWidth: 800,
        py: 3,
      }}
    >
      <Explainer />
      <EnvelopeTable
        month={month}
        onShowTransactions={openTransactions}
        onOpenOverview={openOverview}
        onOpenDetails={openEnvelopeInfo}
      />
    </Box>
  )

  return (
    <>
      <Helmet>
        <title>Бюджет на {formatDate(month, 'LLLL yyyy')} | Zerro</title>
        <meta name="description" content="" />
        <link rel="canonical" href="https://zerro.app/budget" />
      </Helmet>

      <BudgetPopoverProvider month={month}>
        <GoalPopoverProvider month={month}>
          <DnDContext>
            <BudgetLayout
              mainContent={mainContent}
              sideContent={detailsContent}
              sideDefault={sideDefault}
              onSideClose={closeDrawer}
            />
            <BudgetTransactionsDrawer />
          </DnDContext>
        </GoalPopoverProvider>
      </BudgetPopoverProvider>
    </>
  )
}

const BudgetLayout: FC<{
  mainContent: ReactElement
  sideContent?: ReactElement
  sideDefault: ReactElement
  onSideClose: () => void
}> = props => {
  const sideWidth = 360
  const { mainContent, sideContent, sideDefault, onSideClose } = props
  const isMD = useMediaQuery<Theme>(theme => theme.breakpoints.down('lg'))
  const isXS = useMediaQuery<Theme>(theme => theme.breakpoints.down('sm'))

  const drawerVisibility = isMD && !!sideContent
  const cachedContent = useCachedValue(sideContent, drawerVisibility)

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Box
        sx={{
          display: 'flex',
          flexGrow: 1,
          justifyContent: 'center',
          height: '100%',
          overflow: 'auto',
          px: isMD ? 1 : 3,
          pb: 6,
        }}
      >
        {mainContent}
      </Box>

      {!isMD && (
        <Box
          sx={{
            width: sideWidth,
            flexShrink: 0,
            height: '100%',
            overflow: 'auto',
            bgcolor: 'background.paper',
          }}
        >
          {sideContent || sideDefault}
        </Box>
      )}

      <Drawer anchor="right" open={drawerVisibility} onClose={onSideClose}>
        <Box sx={{ width: isXS ? '100vw' : sideWidth }}>{cachedContent}</Box>
      </Drawer>
    </Box>
  )
}

function useMonthHotkeys() {
  const monthList = balances.useMonthList()
  const minMonth = monthList[0]
  const maxMonth = monthList[monthList.length - 1]
  const [month, setMonth] = useMonth()

  useHotkeys(
    'left',
    () => {
      const prevMonthISO = toISOMonth(prevMonth(month))
      if (minMonth <= prevMonthISO) setMonth(prevMonthISO)
    },
    [month, minMonth]
  )
  useHotkeys(
    'right',
    () => {
      const nextMonthISO = toISOMonth(nextMonth(month))
      if (nextMonthISO <= maxMonth) setMonth(nextMonthISO)
    },
    [month, maxMonth]
  )
}
