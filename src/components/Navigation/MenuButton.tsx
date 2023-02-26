import React, { FC, useState } from 'react'
import { SettingsIcon } from '@shared/ui/Icons'
import { IconButton, IconButtonProps } from '@mui/material'
import { Tooltip } from '@shared/ui/Tooltip'
import { SettingsMenu } from './SettingsMenu'
import { usePopover } from '@shared/hooks/useEnvelopePopover'

interface MenuButtonProps extends IconButtonProps {
  showLinks?: boolean
}

export const MenuButton: FC<MenuButtonProps> = ({ showLinks, ...rest }) => {
  const settingsMenu = usePopover('settingsMenu')
  return (
    <>
      <Tooltip title="Настройки">
        <IconButton onClick={settingsMenu.onOpen} {...rest}>
          <SettingsIcon />
        </IconButton>
      </Tooltip>
      <SettingsMenu {...settingsMenu.popoverProps} showLinks={showLinks} />
    </>
  )
}
