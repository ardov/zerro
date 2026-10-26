import { useCallback } from 'react'
import { useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'

import { PanelScrollable } from '@/6-shared/ui/layout/Panel'
import { useColumns } from '@/6-shared/ui/layout/useColumns'
import { Columns } from '@/6-shared/ui/layout/Columns'
import { AccountsPanel } from '@/3-widgets/account/AccountsPanel'
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
  const layout = useColumns()
  const accountsPanelFits = layout.visible.includes('accounts')
  const monthOverviewFits = layout.visible.includes('overview')
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

  return (
    <>
      <title>
        {`${t('pageTitle', { month: formatDate(month, 'LLLL yyyy') })} | Zerro`}
      </title>
      <meta name="description" content="" />
      <link rel="canonical" href="https://zerro.app/budget" />

      <DnDContext>
        <Columns>
          {accountsPanelFits && <AccountsPanel />}
          <PanelScrollable contentClassName="flex justify-center">
            <div className="relative flex h-fit w-full max-w-[800px] flex-col gap-4 pb-6">
              <EnvelopeTable
                month={month}
                onShowTransactions={openTransactions}
                onOpenOverview={openOverview}
                onOpenDetails={openSide}
              />
            </div>
          </PanelScrollable>
          <SideContent docked={monthOverviewFits} />
        </Columns>
      </DnDContext>
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
