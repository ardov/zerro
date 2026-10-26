import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BudgetIcon,
  AccountBalanceWalletIcon,
  BarChartIcon,
  HelpOutlineIcon,
  SyncAltIcon,
} from '@/6-shared/ui/Icons'

export type TDestination = { path: string; label: string; icon: ReactNode }

/** The places the rail and the bottom bar lead to, in order.
 *
 * Accounts is one of them only while the window has no room for the accounts
 * panel: past that width the accounts live beside the transaction list
 * instead. About is one only in the rail; the bottom bar leaves it to the
 * settings menu. */
export function useDestinations(props: {
  mobile: boolean
  accountsPanelFits: boolean
}) {
  const { mobile, accountsPanelFits } = props
  const { t } = useTranslation('navigation')
  const destinations: TDestination[] = [
    { path: '/transactions', label: t('transactions'), icon: <SyncAltIcon /> },
    { path: '/budget', label: t('budget'), icon: <BudgetIcon /> },
  ]
  if (!accountsPanelFits)
    destinations.push({
      path: '/accounts',
      label: t('accounts'),
      icon: <AccountBalanceWalletIcon />,
    })
  destinations.push({
    path: '/stats',
    label: t('stats'),
    icon: <BarChartIcon />,
  })
  if (!mobile)
    destinations.push({
      path: '/about',
      label: t('about'),
      icon: <HelpOutlineIcon />,
    })
  return destinations
}
