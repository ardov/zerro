import React, { FC } from 'react'
import { IconButton, IconButtonProps } from '@mui/material'
import { SettingsIcon } from '@shared/ui/Icons'
import { Tooltip } from '@shared/ui/Tooltip'
import { usePopover } from '@shared/ui/PopoverManager'

import { SettingsMenu, settingsMenuKey } from './SettingsMenu'

interface MenuButtonProps extends IconButtonProps {
  showLinks?: boolean
}

export const MenuButton: FC<MenuButtonProps> = ({ showLinks, ...rest }) => {
  const settingsMenu = usePopover(settingsMenuKey)
  return (
    <>
      <Tooltip title="Настройки">
        <IconButton onClick={settingsMenu.openOnClick} {...rest}>
          <SettingsIcon />
        </IconButton>
      </Tooltip>
      <SettingsMenu {...settingsMenu.props} showLinks={showLinks} />
    </>
  )
}
