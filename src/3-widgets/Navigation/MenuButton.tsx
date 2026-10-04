import type { IconButtonProps } from '@/6-shared/ui/kit/Button'
import { IconButton } from '@/6-shared/ui/kit/Button'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { SettingsIcon } from '@/6-shared/ui/Icons'

import { useAsk } from '@/6-shared/overlays'
import { SettingsMenu } from './SettingsMenu'

interface MenuButtonProps extends Omit<IconButtonProps, 'label'> {
  showLinks?: boolean
}

export const MenuButton: FC<MenuButtonProps> = ({ showLinks, ...rest }) => {
  const { t } = useTranslation('navigation')
  const ask = useAsk()
  return (
    <IconButton
      variant="ghost"
      size="sm"
      label={t('settings')}
      onClick={e =>
        ask(<SettingsMenu showLinks={showLinks} anchorEl={e.currentTarget} />)
      }
      {...rest}
    >
      <SettingsIcon />
    </IconButton>
  )
}
