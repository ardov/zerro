import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AccountBalanceIcon,
  AccountBalanceWalletIcon,
  BarChartIcon,
  HelpOutlineIcon,
  SyncAltIcon,
} from '@/6-shared/ui/Icons'
import { useAccountsPanelFits } from '@/6-shared/ui/layout/panelWidths'

export type TDestination = { path: string; label: string; icon: ReactNode }

/** The places the rail and the bottom bar lead to, in order. Accounts is one
 * of them only while the window has no room for the accounts panel: past
 * that width the accounts live beside the transaction list instead. */
export function useDestinations(opts: { includeAbout: boolean }) {
  const { t } = useTranslation('navigation')
  const accountsPanelFits = useAccountsPanelFits()
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
  if (opts.includeAbout)
    destinations.push({
      path: '/about',
      label: t('about'),
      icon: <HelpOutlineIcon />,
    })
  return destinations
}
