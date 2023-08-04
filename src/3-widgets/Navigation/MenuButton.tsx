import React, { FC } from 'react'
import { IconButton, IconButtonProps } from '@mui/material'
import { SettingsIcon } from '6-shared/ui/Icons'
import { Tooltip } from '6-shared/ui/Tooltip'

import { SettingsMenu, useSettingsMenu } from './SettingsMenu'

interface MenuButtonProps extends IconButtonProps {
  showLinks?: boolean
}

export const MenuButton: FC<MenuButtonProps> = ({ showLinks, ...rest }) => {
  const openSettings = useSettingsMenu()
  return (
    <>
      <Tooltip title="Настройки">
        <IconButton onClick={openSettings} {...rest}>
          <SettingsIcon />
        </IconButton>
      </Tooltip>
      <SettingsMenu showLinks={showLinks} />
    </>
  )
}
