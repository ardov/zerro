import {
  NavigationAction,
  type NavigationActionProps,
} from './NavigationAction'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { SettingsIcon } from '@/6-shared/ui/Icons'

import { useAsk } from '@/6-shared/overlays'
import { SettingsMenu } from './SettingsMenu'

type MenuButtonProps = Omit<NavigationActionProps, 'label' | 'icon'>

export const MenuButton: FC<MenuButtonProps> = props => {
  const { t } = useTranslation('navigation')
  const ask = useAsk()
  return (
    <NavigationAction
      icon={SettingsIcon}
      label={t('settings')}
      onClick={() => ask(<SettingsMenu />)}
      {...props}
    />
  )
}
