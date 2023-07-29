import React, { FC, ReactElement, useCallback } from 'react'
import { Helmet } from 'react-helmet'
import { Box, Theme, useMediaQuery } from '@mui/material'
import { useHotkeys } from 'react-hotkeys-hook'
import { formatDate } from '@shared/helpers/date'
import { nextMonth, prevMonth, toISOMonth } from '@shared/helpers/date'
import { MonthProvider, useMonth } from './MonthProvider'
import { TEnvelopeId } from '@entities/envelope'

import { balances, TrFilterMode } from '@entities/envBalances'

import { useTrDrawer } from './useTrDrawer'
import { EnvelopeTable } from './EnvelopeTable'
import { DnDContext } from './DnDContext'
import { SmartBudgetPopover } from './BudgetPopover'
import { SmartGoalPopover } from './GoalPopover'
import { Explainer } from './Explainer'
import { SideContent, useSideContent } from './SideContent'

export default function WithMonth() {
  return (
    <MonthProvider>
      <Budgets />
    </MonthProvider>
  )
}

function Budgets() {
  useMonthHotkeys()
  const [month] = useMonth()
  const openSide = useSideContent()
  const showTransactions = useTrDrawer()
  const openOverview = useCallback(() => openSide('overview'), [openSide])

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
        onOpenDetails={openSide}
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
        <BudgetLayout mainContent={mainContent} />
      </DnDContext>

      <SmartGoalPopover />
      <SmartBudgetPopover />
    </>
  )
}

const sideWidth = 360
const sideSx = {
  width: sideWidth,
  flexShrink: 0,
  overflow: 'auto',
  bgcolor: 'background.paper',
}

const BudgetLayout: FC<{
  mainContent: ReactElement
}> = props => {
  const { mainContent } = props
  const isMD = useMediaQuery<Theme>(theme => theme.breakpoints.down('lg'))

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Box
        sx={{
          display: 'flex',
          flexGrow: 1,
          justifyContent: 'center',
          height: '100%',
          overflow: 'auto',
          px: { xs: 1, md: 3 },
          pb: 6,
        }}
      >
        {mainContent}
      </Box>

      {isMD ? (
        <SideContent width={sideWidth} />
      ) : (
        <Box sx={sideSx}>
          <SideContent width={sideWidth} docked />
        </Box>
      )}
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
