import React, {
  FC,
  ReactElement,
  useCallback,
  useEffect,
  useState,
} from 'react'
import { Redirect } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { Box, Drawer, Theme, useMediaQuery } from '@mui/material'
import { useHotkeys } from 'react-hotkeys-hook'
import { formatDate } from '@shared/helpers/date'
import { useSearchParam } from '@shared/hooks/useSearchParam'
import { nextMonth, prevMonth, toISOMonth } from '@shared/helpers/date'
import { TEnvelopeId } from '@shared/types'
import { useAppSelector } from '@store'
import { getMonthList, useMonthList } from '@entities/envelopeData'
import { GoalsProgress } from '@features/bulkActions/fillGoals'
import { MonthInfo } from './components/MonthInfo'
import { ToBeBudgeted } from './components/ToBeBudgeted'
import { MonthSelect } from './MonthSelect'
import { EnvelopePreview } from './widgets/EnvelopePreview'
import { BudgetTransactionsDrawer } from './components/TransactionsDrawer'
import { EnvelopeTable } from './widgets/EnvelopeTable'
import { useMonth } from './model'
import { DnDContext } from './widgets/DnDContext'

export default function BudgetsRouter() {
  const [month] = useMonth()
  const monthList = useMonthList()
  const minMonth = monthList[0]
  const maxMonth = monthList[monthList.length - 1]

  if (!month) {
    return <Redirect to={`/budget/?month=${toISOMonth(new Date())}`} />
  }
  if (month < minMonth) {
    return <Redirect to={`/budget/?month=${minMonth}`} />
  }
  if (month > maxMonth) {
    return <Redirect to={`/budget/?month=${maxMonth}`} />
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
  const isMD = useMediaQuery<Theme>(theme => theme.breakpoints.down('lg'))

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
      }}
    >
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          position: 'sticky',
          top: 0,
          zIndex: 9,
        }}
      >
        <MonthSelect
          onChange={setMonth}
          {...{ minMonth, maxMonth, value: month }}
        />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <GoalsProgress month={month} />
          <ToBeBudgeted onClick={openOverview} />
        </Box>
      </Box>

      <EnvelopeTable onOpenDetails={openEnvelopeInfo} />
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

type BudgetLayoutProps = {
  mainContent: ReactElement
  sideContent?: ReactElement
  sideDefault: ReactElement
  onSideClose: () => void
}
const sideWidth = 360

const BudgetLayout: FC<BudgetLayoutProps> = props => {
  const { mainContent, sideContent, sideDefault, onSideClose } = props
  const isMD = useMediaQuery<Theme>(theme => theme.breakpoints.down('lg'))
  const isXS = useMediaQuery<Theme>(theme => theme.breakpoints.down('sm'))

  const drawerVisibility = isMD && !!sideContent
  const cachedContent = useCachedValue(sideContent)

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
          py: 3,
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

function useCachedValue<T>(value: T): T {
  const [cachedValue, setCachedValue] = useState(value)
  useEffect(() => {
    if (value) setCachedValue(value)
  }, [value])
  return cachedValue
}
