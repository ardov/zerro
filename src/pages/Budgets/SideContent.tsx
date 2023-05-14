import React, { FC, memo, useCallback } from 'react'
import { Box, Drawer } from '@mui/material'
import { TEnvelopeId } from '@entities/envelope'
import { MonthInfo } from './MonthInfo'
import { EnvelopePreview } from './EnvelopePreview'
import { makePopoverHooks } from '@shared/ui/PopoverManager'

type TDrawerId = TEnvelopeId | 'overview'

const sideDrawer = makePopoverHooks<{ id: TDrawerId }>('sideContent', {
  id: 'overview',
})

export const useSideContent = () => {
  const { open } = sideDrawer.useMethods()
  return useCallback((id: TDrawerId) => open({ id }), [open])
}

export const SideContent: FC<{ docked?: boolean; width: number }> = props => {
  const drawer = sideDrawer.useProps()
  return (
    <MemoSideDrawer
      {...drawer.displayProps}
      {...drawer.extraProps}
      docked={props.docked}
      width={props.width}
    />
  )
}

type TSideContentProps = {
  open: boolean
  onClose: () => void
  id?: TDrawerId
  docked?: boolean
  width: number
}
const MemoSideDrawer = memo<TSideContentProps>(props => {
  const { open, onClose, id, docked, width } = props

  const drawerContent =
    !id || id === 'overview' ? (
      <MonthInfo onClose={onClose} />
    ) : (
      <EnvelopePreview onClose={onClose} id={id} />
    )

  if (docked) {
    return open ? drawerContent : <MonthInfo onClose={onClose} />
  }

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: { xs: '100vw', sm: width } }}>{drawerContent}</Box>
    </Drawer>
  )
})
