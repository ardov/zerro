import { useState } from 'react'
import { TEnvelopeId, TISOMonth } from '@shared/types'
import { PopoverProps } from '@mui/material'

export function useEnvelopePopover(month: TISOMonth, name = '') {
  const [anchorEl, setAnchorEl] = useState<Element>()
  const [id, setId] = useState<TEnvelopeId>()
  const open = !!anchorEl
  const onOpen = (id: TEnvelopeId, anchor: Element) => {
    setAnchorEl(anchor)
    setId(id)
  }

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
  const onOpen = (props: T, anchor: Element) => {
    setAnchorEl(anchor)
    setProps(props)
  }

  const popoverProps: PopoverProps = {
    open,
    anchorEl,
    onClose: () => {
      setAnchorEl(undefined)
    },
  }
  return { props: popoverProps, additional: props, onOpen }
}
