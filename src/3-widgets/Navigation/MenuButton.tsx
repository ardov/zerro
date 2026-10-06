import type { IconButtonProps } from '@/6-shared/ui/kit/Button'
import { IconButton } from '@/6-shared/ui/kit/Button'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { SettingsIcon } from '@/6-shared/ui/Icons'

import { useAsk } from '@/6-shared/overlays'
import { SettingsMenu } from './SettingsMenu'

type MenuButtonProps = Omit<IconButtonProps, 'label'>

export const MenuButton: FC<MenuButtonProps> = props => {
  const { t } = useTranslation('navigation')
  const ask = useAsk()
  return (
    <IconButton
      variant="ghost"
      size="sm"
      label={t('settings')}
      onClick={() => ask(<SettingsMenu />)}
      {...props}
    >
      <SettingsIcon />
    </IconButton>
  )
}
