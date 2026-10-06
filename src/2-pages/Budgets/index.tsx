import type { FC, ReactElement } from 'react'
import { useCallback } from 'react'
import { useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'

import { Panel } from '@/6-shared/ui/layout/Panel'
import { panelWidths, useWindowFits } from '@/6-shared/ui/layout/panelWidths'
import { useHotkeys } from 'react-hotkeys-hook'
import { useTranslation } from 'react-i18next'
import { formatDate } from '@/6-shared/helpers/date'
import { nextMonth, prevMonth, toISOMonth } from '@/6-shared/helpers/date'

import { useEnvTransactionsDrawer } from '@/3-widgets/global/EnvTransactionsDrawer'

import { MonthProvider, useMonth } from './MonthProvider'
import { EnvelopeTable } from './EnvelopeTable'
import { DnDContext } from './DnD/DnDContext'
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
  const openSide = useSideContent()
  const transactionDrawer = useEnvTransactionsDrawer()
  const openOverview = useCallback(() => openSide('overview'), [openSide])

  const openTransactions = useCallback(
    (opts: { id: core.envelopes.TEnvelopeId; isExact?: boolean }) =>
      transactionDrawer({
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
    <div className="relative flex h-fit w-full max-w-[800px] flex-col gap-4 pb-6">
      <EnvelopeTable
        month={month}
        onShowTransactions={openTransactions}
        onOpenOverview={openOverview}
        onOpenDetails={openSide}
      />
    </div>
  )

  return (
    <>
      <title>
        {`${t('pageTitle', { month: formatDate(month, 'LLLL yyyy') })} | Zerro`}
      </title>
      <meta name="description" content="" />
      <link rel="canonical" href="https://zerro.app/budget" />

      <DnDContext>
        <BudgetLayout mainContent={mainContent} />
      </DnDContext>
    </>
  )
}

/** The envelope list and, while the window holds both, the month overview
 * beside it. Without the room the overview becomes a drawer. An envelope's
 * detail takes the overview's place either way. */
const BudgetLayout: FC<{
  mainContent: ReactElement
}> = props => {
  const { mainContent } = props
  const monthOverviewFits = useWindowFits(
    panelWidths.envelopeList,
    panelWidths.monthOverview
  )

  return (
    <>
      <Panel className="flex min-w-0 grow justify-center">{mainContent}</Panel>

      {monthOverviewFits ? (
        <Panel
          className="shrink-0"
          style={{ width: panelWidths.monthOverview }}
        >
          <SideContent docked />
        </Panel>
      ) : (
        <SideContent />
      )}
    </>
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
