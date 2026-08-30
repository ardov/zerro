import type { IconButtonProps } from '6-shared/ui/Button'
import { IconButton } from '6-shared/ui/Button'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { SettingsIcon } from '6-shared/ui/Icons'
import { Tooltip } from '6-shared/ui/Tooltip'

import { useAsk } from '6-shared/overlays'
import { SettingsMenu } from './SettingsMenu'

interface MenuButtonProps extends IconButtonProps {
  showLinks?: boolean
}

export const MenuButton: FC<MenuButtonProps> = ({ showLinks, ...rest }) => {
  const { t } = useTranslation('navigation')
  const ask = useAsk()
  return (
    <Tooltip title={t('settings')}>
      <IconButton
        onClick={e =>
          ask(<SettingsMenu showLinks={showLinks} anchorEl={e.currentTarget} />)
        }
        {...rest}
      >
        <SettingsIcon />
      </IconButton>
    </Tooltip>
  )
}
