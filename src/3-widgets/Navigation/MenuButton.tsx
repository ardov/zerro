import {
  NavigationAction,
  type NavigationActionProps,
} from './NavigationAction'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { SettingsIcon } from '@/6-shared/ui/Icons'
import { settingsScreen } from './SettingsScreen'

type MenuButtonProps = Omit<NavigationActionProps, 'label' | 'icon'>

export const MenuButton: FC<MenuButtonProps> = props => {
  const { t } = useTranslation('navigation')
  const openSettings = settingsScreen.useOpen()
  return (
    <NavigationAction
      {...props}
      icon={SettingsIcon}
      label={t('settings')}
      onClick={() => openSettings(true)}
    />
  )
}
