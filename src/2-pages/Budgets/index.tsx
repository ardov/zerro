import type { FC, ReactElement } from 'react'
import { useCallback } from 'react'
import { useAppSelector } from 'store'
import { core } from 'zerro-core/redux'

import { Helmet } from 'react-helmet-async'
import type { Theme } from '@mui/material'
import { Box, useMediaQuery } from '@mui/material'
import { useHotkeys } from 'react-hotkeys-hook'
import { useTranslation } from 'react-i18next'
import { formatDate } from '6-shared/helpers/date'
import { nextMonth, prevMonth, toISOMonth } from '6-shared/helpers/date'
import { useDocumentTitle } from '6-shared/hooks/useDocumentTitle'

import { useEnvTransactionsDrawer } from '3-widgets/global/EnvTransactionsDrawer'

import { MonthProvider, useMonth } from './MonthProvider'
import { EnvelopeTable } from './EnvelopeTable'
import { DnDContext } from './DnD/DnDContext'
import { SmartBudgetPopover } from './BudgetPopover'
import { SmartGoalPopover } from './GoalPopover'
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
  const { t } = useTranslation('budgets')
  const [month] = useMonth()
  useDocumentTitle(
    `${t('pageTitle', { month: formatDate(month, 'LLLL yyyy') })} | Zerro`
  )
  const openSide = useSideContent()
  const transactionDrawer = useEnvTransactionsDrawer()
  const openOverview = useCallback(() => openSide('overview'), [openSide])

  const openTransactions = useCallback(
    (opts: { id: core.envelopes.TEnvelopeId; isExact?: boolean }) =>
      transactionDrawer.open({
        envelopeConditions: {
          id: opts.id,
          month,
          mode: core.transactions.TrFilterMode.Envelope,
          isExact: opts.isExact,
        },
      }),
    [month, transactionDrawer]
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
  const monthList = useAppSelector(core.months.selectList)
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
