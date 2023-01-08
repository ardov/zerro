import React, { FC, useState } from 'react'
import { SettingsIcon } from '@shared/ui/Icons'
import { IconButton, IconButtonProps } from '@mui/material'
import { Tooltip } from '@shared/ui/Tooltip'
import { SettingsMenu } from './SettingsMenu'

interface MenuButtonProps extends IconButtonProps {
  showLinks?: boolean
}

export const MenuButton: FC<MenuButtonProps> = ({ showLinks, ...rest }) => {
  const [anchorEl, setAnchorEl] = useState<Element | null>(null)
  const handleClose = () => setAnchorEl(null)
  return (
    <>
      <Tooltip title="Настройки">
        <IconButton onClick={e => setAnchorEl(e.currentTarget)} {...rest}>
          <SettingsIcon />
        </IconButton>
      </Tooltip>
      <SettingsMenu
        anchorEl={anchorEl}
        onClose={handleClose}
        showLinks={showLinks}
      />
    </>
  )
}
