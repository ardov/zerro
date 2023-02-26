import { useCallback, useState } from 'react'
import type { Modify, TISOMonth } from '@shared/types'
import type { TEnvelopeId } from '@entities/envelope'
import { PopoverProps } from '@mui/material'
import { useLocationState } from './useLocationState'

export function useEnvelopePopover(month: TISOMonth, name = '') {
  const [anchorEl, setAnchorEl] = useState<Element>()
  const [id, setId] = useState<TEnvelopeId>()
  const [open, openPopover, closePopover] = useLocationState(name)
  const onOpen = useCallback(
    (id: TEnvelopeId, anchor: Element) => {
      setAnchorEl(anchor)
      setId(id)
      openPopover()
    },
    [openPopover]
  )
  const onClose = useCallback(() => {
    closePopover()
    setAnchorEl(undefined)
  }, [closePopover])

  const props = {
    key: name + id + month,
    id,
    month,
    open,
    anchorEl,
    onClose,
  }
  return { props, onOpen }
}

export function usePopover<T extends object>(key: string) {
  const [anchorEl, setAnchorEl] = useState<Element>()
  const [props, setProps] = useState<T | undefined>()
  const [open, openPopover, closePopover] = useLocationState(key)

  const onOpen = useCallback(
    (event?: React.MouseEvent, props?: T) => {
      setAnchorEl(event?.currentTarget)
      setProps(props)
      openPopover()
    },
    [openPopover]
  )
  const onClose = useCallback(() => {
    closePopover()
  }, [closePopover])
  const popoverProps: Modify<PopoverProps, { onClose: () => void }> = {
    open,
    anchorEl,
    onClose,
  }
  return { popoverProps, additional: props, onOpen, onClose }
}
