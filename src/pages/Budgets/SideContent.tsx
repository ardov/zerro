import React, { FC, memo, useCallback } from 'react'
import { Box, Drawer, Theme, useMediaQuery } from '@mui/material'
import {
  TPopoverProps,
  usePopoverMethods,
  usePopoverProps,
} from '@shared/ui/PopoverManager'
import { TEnvelopeId } from '@entities/envelope'
import { MonthInfo } from './MonthInfo'
import { EnvelopePreview } from './EnvelopePreview'

export const sideContentKey = 'sideContent'

export const useSideContent = () => {
  const methods =
    usePopoverMethods<TPopoverProps & { id: TDrawerId }>(sideContentKey)
  const open = useCallback(
    (id: TDrawerId) => {
      methods.open({ id })
    },
    [methods]
  )
  return open
}

export const SideContent: FC<{ docked?: boolean; width: number }> = props => {
  const popoverProps =
    usePopoverProps<TPopoverProps & { id: TDrawerId }>(sideContentKey)

  return (
    <MemoSideDrawer
      open={popoverProps.open}
      onClose={popoverProps.onClose}
      id={popoverProps.id}
      docked={props.docked}
      width={props.width}
    />
  )
}

type TDrawerId = TEnvelopeId | 'overview'
type TSideContentProps = {
  open: boolean
  onClose: () => void
  id?: TDrawerId
  docked?: boolean
  width: number
}
const MemoSideDrawer = memo<TSideContentProps>(props => {
  const isXS = useMediaQuery<Theme>(theme => theme.breakpoints.down('sm'))
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
      <Box sx={{ width: isXS ? '100vw' : width }}>{drawerContent}</Box>
    </Drawer>
  )
})
