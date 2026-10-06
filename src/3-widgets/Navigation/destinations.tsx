import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useBreakpointDown } from '@/6-shared/hooks/useBreakpointDown'
import {
  AccountBalanceIcon,
  AccountBalanceWalletIcon,
  BarChartIcon,
  HelpOutlineIcon,
  SyncAltIcon,
} from '@/6-shared/ui/Icons'
import { useAccountsPanelFits } from '@/6-shared/ui/layout/panelWidths'

export type TDestination = { path: string; label: string; icon: ReactNode }

/** Whether navigation is the bottom bar rather than the rail. */
export function useBottomBarShown() {
  return useBreakpointDown('sm')
}

/** The places the rail and the bottom bar lead to, in order.
 *
 * Accounts is one of them only while the window has no room for the accounts
 * panel: past that width the accounts live beside the transaction list
 * instead. About is one only in the rail; the bottom bar leaves it to the
 * settings menu. */
export function useDestinations() {
  const { t } = useTranslation('navigation')
  const accountsPanelFits = useAccountsPanelFits()
  const bottomBar = useBottomBarShown()
  const destinations: TDestination[] = [
    { path: '/budget', label: t('budget'), icon: <AccountBalanceIcon /> },
    { path: '/transactions', label: t('transactions'), icon: <SyncAltIcon /> },
    { path: '/stats', label: t('stats'), icon: <BarChartIcon /> },
  ]
  if (!accountsPanelFits)
    destinations.push({
      path: '/accounts',
      label: t('accounts'),
      icon: <AccountBalanceWalletIcon />,
    })
  if (!bottomBar)
    destinations.push({
      path: '/about',
      label: t('about'),
      icon: <HelpOutlineIcon />,
    })
  return destinations
}
