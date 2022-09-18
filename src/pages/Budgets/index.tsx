import React, { FC, ReactElement, useCallback } from 'react'
import { Redirect } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { Box, Drawer, Theme, useMediaQuery } from '@mui/material'
import { useHotkeys } from 'react-hotkeys-hook'
import { TEnvelopeId } from '@shared/types'
import { formatDate } from '@shared/helpers/date'
import { useCachedValue } from '@shared/hooks/useCachedValue'
import { useSearchParam } from '@shared/hooks/useSearchParam'
import { nextMonth, prevMonth, toISOMonth } from '@shared/helpers/date'
import { useAppSelector } from '@store'
import { getMonthList, useMonthList } from '@entities/envelopeData'
import { MonthInfo } from './widgets/MonthInfo'
import { EnvelopePreview } from './widgets/EnvelopePreview'
import { BudgetTransactionsDrawer } from './widgets/TransactionsDrawer'
import { EnvelopeTable } from './widgets/EnvelopeTable'
import { useMonth } from './model'
import { DnDContext } from './widgets/DnDContext'

export default function BudgetsRouter() {
  const [month] = useMonth()
  const monthList = useMonthList()
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
  const monthList = useAppSelector(getMonthList)
  const minMonth = monthList[0]
  const maxMonth = monthList[monthList.length - 1]
  const [month, setMonth] = useMonth()

  const [drawerId, setDrawerId] = useSearchParam<TDrawerId>('drawer')

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

  const openOverview = useCallback(() => setDrawerId('overview'), [setDrawerId])
  const openEnvelopeInfo = useCallback(
    (id: TEnvelopeId | null) => setDrawerId(id),
    [setDrawerId]
  )
  const closeDrawer = useCallback(() => setDrawerId(), [setDrawerId])

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
      <EnvelopeTable
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
          sideDefault={sideDefault}
          onSideClose={closeDrawer}
        />
        <BudgetTransactionsDrawer />
      </DnDContext>
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
