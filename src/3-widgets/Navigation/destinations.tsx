import { useAboutPath } from '@/6-shared/localization/useAboutPath'
import type { ComponentType } from 'react'
import type { TIconProps } from '@/6-shared/ui/lucide/createIcon'
import { useTranslation } from 'react-i18next'
import {
  BudgetIcon,
  AccountBalanceWalletIcon,
  BarChartIcon,
  HowToUseIcon,
  SyncAltIcon,
} from '@/6-shared/ui/Icons'

export type TDestination = {
  path: string
  label: string
  icon: ComponentType<TIconProps>
}

/** Accounts is a navigation destination only while the layout cannot show its own accounts panel. */
export function useDestinations(props: {
  mobile: boolean
  accountsPanelFits: boolean
}) {
  const { mobile, accountsPanelFits } = props
  const { t } = useTranslation('navigation')
  const aboutPath = useAboutPath()
  const destinations: TDestination[] = [
    { path: '/transactions', label: t('transactions'), icon: SyncAltIcon },
    { path: '/budget', label: t('budget'), icon: BudgetIcon },
  ]
  if (!accountsPanelFits)
    destinations.push({
      path: '/accounts',
      label: t('accounts'),
      icon: AccountBalanceWalletIcon,
    })
  destinations.push({
    path: '/stats',
    label: t('stats'),
    icon: BarChartIcon,
  })
  if (!mobile)
    destinations.push({
      path: aboutPath,
      label: t('about'),
      icon: HowToUseIcon,
    })
  return destinations
}
