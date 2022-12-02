import React, { useCallback, useRef, useState } from 'react'
import { DragEndEvent, DragMoveEvent, useDndMonitor } from '@dnd-kit/core'
import { Box, SxProps } from '@mui/system'
import { DragTypes } from '../DnDContext'
import { useAppDispatch } from '@store/index'
import { envelopeModel, TEnvelope } from '@entities/envelope'
import { ById, TEnvelopeId } from '@shared/types'
import { moveEnvelope } from '@features/envelope/moveEnvelope'

const style: SxProps = {
  border: '1px solid red',
  borderColor: 'primary.main',
  transition: '0.1s ease-in-out',
  borderRadius: 1,
  position: 'fixed',
  display: 'none',
  top: 0,
  left: 0,
  height: 2,
  width: 100,
  zIndex: 100,
  willChange: 'transform width height',
}

const OFFSET = 100

export function Highlight() {
  const dispatch = useAppDispatch()
  const [isDragging, setIsDragging] = useState(false)

  const envelopes = envelopeModel.useEnvelopes()

  const boxRef = useRef<HTMLDivElement>(null)

  const onDragMove = useCallback(
    (e: DragMoveEvent) => {
      const el = boxRef.current
      if (!el) return
      const info = whatsHappening(e, envelopes, OFFSET)

      if (!info) {
        el.style.display = `none`
        return
      }

      if (
        info.activeType === DragTypes.envelope &&
        info.overType === DragTypes.envelope
      ) {
        let width = info.overRect.width - (info.isNesting ? OFFSET : 0)
        let left = info.overRect.left + (info.isNesting ? OFFSET : 0)
        let top = info.overRect.top + info.overRect.height
        el.style.display = `block`
        el.style.width = `${width}px`
        el.style.height = `2px`
        el.style.transform = `translate(${left}px, ${top}px)`
      }

      if (
        info.activeType === DragTypes.amount &&
        info.overType === DragTypes.envelope
      ) {
        const brdr = 4
        el.style.display = `block`
        el.style.width = `${info.overRect.width + brdr * 2}px`
        el.style.height = `${info.overRect.height + brdr * 2}px`
        el.style.transform = `translate(${info.overRect.left - brdr}px, ${
          info.overRect.top - brdr
        }px)`
      }
    },
    [envelopes]
  )

  const onDragEnd = useCallback(
    (e: DragEndEvent) => {
      setIsDragging(false)
      const info = whatsHappening(e, envelopes, OFFSET)
      if (!info) return

      if (
        info.activeType === DragTypes.envelope &&
        info.overType === DragTypes.envelope
      ) {
        const activeEnv = envelopes[info.activeId]
        const overEnv = envelopes[info.overId]
        if (activeEnv.id === overEnv.id) return
        if (overEnv.parent && activeEnv.id === overEnv.parent) return
        dispatch(moveEnvelope(activeEnv.index, overEnv.index, info.isNesting))
      }
    },
    [dispatch, envelopes]
  )

  const onDragCancel = useCallback(() => {
    setIsDragging(false)
    if (boxRef.current) {
      boxRef.current.style.display = `none`
    }
  }, [])

  useDndMonitor({
    onDragStart: () => setIsDragging(true),
    onDragMove,
    onDragEnd,
    onDragCancel,
  })

  return isDragging ? <Box ref={boxRef} sx={style} /> : null
}

function whatsHappening(
  e: DragEndEvent | DragMoveEvent,
  envelopes: ById<TEnvelope>,
  offset: number
) {
  const activeData = e.active.data.current
  const activeRect = e.active.rect.current.translated
  const overData = e.over?.data.current
  const overRect = e.over?.rect

  if (
    // has active
    !activeData ||
    !activeData.id ||
    !activeRect ||
    // has over
    !overData ||
    !overData.id ||
    overData.type !== DragTypes.envelope ||
    !overRect
  ) {
    return null
  }

  const overEnv = envelopes[overData.id as TEnvelopeId]
  const isOverChild = !!overEnv?.parent
  const isLastVisibleChild = !!overData.isLastVisibleChild
  const isExpanded = !!overData.isExpanded
  const tryingToNest = activeRect.left - overRect.left > offset

  return {
    isOverChild,
    isNesting: getNestingState(
      tryingToNest,
      isOverChild,
      isLastVisibleChild,
      isExpanded
    ),

    activeId: activeData.id as TEnvelopeId,
    activeType: activeData.type as DragTypes,
    activeRect: activeRect,

    overId: overData.id as TEnvelopeId,
    overType: overData.type as DragTypes,
    overRect: overRect,
  }
}

function getNestingState(
  tryingToNest: boolean,
  overChild: boolean,
  overLastVisibleChild: boolean,
  isExpanded: boolean
) {
  if (overChild) {
    // Child
    if (overLastVisibleChild) return tryingToNest
    return true
  } else {
    // Parent
    if (isExpanded) return true
    return tryingToNest
  }
}
