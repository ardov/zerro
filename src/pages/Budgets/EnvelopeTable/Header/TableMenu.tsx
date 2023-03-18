import React, { useCallback } from 'react'
import { Menu, MenuItem, PopoverProps } from '@mui/material'
import { makePopoverHooks } from '@shared/ui/PopoverManager'

type TableMenuProps = {
  isAllShown: boolean
  isReordering: boolean
  onShowAllToggle: () => void
  onReorderModeToggle: () => void
}

const tableMenu = makePopoverHooks<TableMenuProps, PopoverProps>('tableMenu', {
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
        {isAllShown ? 'Скрыть часть категорий' : 'Показать все категории'}
      </MenuItem>
      <MenuItem
        onClick={() => {
          popover.close()
          onReorderModeToggle()
        }}
      >
        {isReordering ? 'Скрыть таскалки' : 'Изменить порядок категорий'}
      </MenuItem>
    </Menu>
  )
}
