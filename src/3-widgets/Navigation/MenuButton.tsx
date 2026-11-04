import {
  NavigationAction,
  type NavigationActionProps,
} from './NavigationAction'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { SettingsIcon } from '@/6-shared/ui/Icons'
import { useBackupProblem } from '@/4-features/export/useBackupFolder'
import { settingsScreen } from './SettingsScreen'

type MenuButtonProps = Omit<NavigationActionProps, 'label' | 'icon'>

export const MenuButton: FC<MenuButtonProps> = props => {
  const { t } = useTranslation('navigation')
  const openSettings = settingsScreen.useOpen()
  const backupProblem = useBackupProblem()
  return (
    <NavigationAction
      {...props}
      icon={SettingsIcon}
      label={t('settings')}
      notice={backupProblem}
      onClick={() => openSettings(true)}
    />
  )
}
