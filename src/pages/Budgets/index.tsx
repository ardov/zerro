import React, { FC, ReactElement, useCallback } from 'react'
import { Redirect } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { Box, Drawer, Theme, useMediaQuery } from '@mui/material'
import { useHotkeys } from 'react-hotkeys-hook'
import { formatDate } from '@shared/helpers/date'
import { useCachedValue } from '@shared/hooks/useCachedValue'
import { nextMonth, prevMonth, toISOMonth } from '@shared/helpers/date'
import { useMonth } from '@shared/hooks/useMonth'
import { TPopoverProps, usePopover } from '@shared/ui/PopoverManager'
import { TEnvelopeId } from '@entities/envelope'

import { balances, TrFilterMode } from '@entities/envBalances'
import { MonthInfo } from './MonthInfo'
import { EnvelopePreview } from './EnvelopePreview'
import { BudgetTransactionsDrawer, useTrDrawer } from './TransactionsDrawer'
import { EnvelopeTable } from './EnvelopeTable'
import { DnDContext } from './DnDContext'
import { SmartBudgetPopover } from './BudgetPopover'
import { SmartGoalPopover } from './GoalPopover'
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
  const popover = usePopover<TPopoverProps & { id: TDrawerId }>('sideContent')
  const drawerId: TDrawerId = popover.props.id || 'overview'

  const showTransactions = useTrDrawer()
  const openOverview = useCallback(
    () => popover.open({ id: 'overview' }),
    [popover]
  )
  const openEnvelopeInfo = useCallback(
    (id: TEnvelopeId) => popover.open({ id }),
    [popover]
  )
  const closeDrawer = popover.close
  const openTransactions = useCallback(
    (opts: { id: TEnvelopeId; isExact?: boolean }) =>
      showTransactions({
        id: opts.id,
        month,
        mode: TrFilterMode.Envelope,
        isExact: opts.isExact,
      }),
    [month, showTransactions]
  )

  const detailsContent = popover.props.open ? (
    drawerId === 'overview' ? (
      <MonthInfo onClose={closeDrawer} />
    ) : (
      <EnvelopePreview onClose={closeDrawer} id={drawerId} />
    )
  ) : (
    <MonthInfo onClose={closeDrawer} />
  )

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

      <DnDContext>
        <BudgetLayout
          mainContent={mainContent}
          sideContent={detailsContent}
          isSideOpened={popover.props.open}
          onSideClose={closeDrawer}
        />
        <BudgetTransactionsDrawer />
      </DnDContext>

      <SmartGoalPopover />
      <SmartBudgetPopover />
    </>
  )
}

const BudgetLayout: FC<{
  mainContent: ReactElement
  sideContent: ReactElement
  isSideOpened: boolean
  onSideClose: () => void
}> = props => {
  const sideWidth = 360
  const { mainContent, sideContent, isSideOpened, onSideClose } = props
  const isMD = useMediaQuery<Theme>(theme => theme.breakpoints.down('lg'))
  const isXS = useMediaQuery<Theme>(theme => theme.breakpoints.down('sm'))

  const drawerVisibility = isMD && isSideOpened
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
          {sideContent}
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
