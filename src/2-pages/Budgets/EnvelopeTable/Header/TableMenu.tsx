import React, { useCallback } from 'react'
import { Menu, MenuItem, PopoverProps } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { registerPopover } from '6-shared/historyPopovers'

type TableMenuProps = {
  isAllShown: boolean
  isReordering: boolean
  onShowAllToggle: () => void
  onReorderModeToggle: () => void
}

const tableMenu = registerPopover<TableMenuProps, PopoverProps>('tableMenu', {
  isAllShown: false,
  isReordering: false,
  onShowAllToggle: () => {},
  onReorderModeToggle: () => {},
})

export const useTableMenu = (props: TableMenuProps) => {
  const { open } = tableMenu.useMethods()
  return useCallback(
    (e: React.MouseEvent) => open({ ...props }, { anchorEl: e.currentTarget }),
    [open, props]
  )
}

export function TableMenu() {
  const { t } = useTranslation('envelopeTableMenu')
  const popover = tableMenu.useProps()
  const { onShowAllToggle, onReorderModeToggle, isReordering, isAllShown } =
    popover.extraProps

  return (
    <Menu {...popover.displayProps}>
      <MenuItem
        onClick={() => {
          popover.close()
          onShowAllToggle()
        }}
      >
        {t(isAllShown ? 'showPrtiallyEnvelopes' : 'showAllEnvelopes')}
      </MenuItem>
      <MenuItem
        onClick={() => {
          popover.close()
          onReorderModeToggle()
        }}
      >
        {t(isReordering ? 'leaveEditMode' : 'goToEditMode')}
      </MenuItem>
    </Menu>
  )
}
