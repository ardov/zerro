import { useCallback, useState } from 'react'
import type { TISOMonth } from '@shared/types'
import type { TEnvelopeId } from '@entities/envelope'
import { PopoverProps } from '@mui/material'

export function useEnvelopePopover(month: TISOMonth, name = '') {
  const [anchorEl, setAnchorEl] = useState<Element>()
  const [id, setId] = useState<TEnvelopeId>()
  const open = !!anchorEl
  const onOpen = useCallback((id: TEnvelopeId, anchor: Element) => {
    setAnchorEl(anchor)
    setId(id)
  }, [])

  const props = {
    key: name + id + month,
    id,
    month,
    open,
    anchorEl,
    onClose: () => {
      setAnchorEl(undefined)
    },
  }
  return { props, onOpen }
}

export function usePopover<T extends object>() {
  const [anchorEl, setAnchorEl] = useState<Element>()
  const [props, setProps] = useState<T | undefined>()
  const open = !!anchorEl
  const onOpen = (event: React.MouseEvent, props?: T) => {
    setAnchorEl(event.currentTarget)
    setProps(props)
  }
  const onClose = () => setAnchorEl(undefined)
  const popoverProps: PopoverProps = { open, anchorEl, onClose }
  return { popoverProps, additional: props, onOpen, onClose }
}
