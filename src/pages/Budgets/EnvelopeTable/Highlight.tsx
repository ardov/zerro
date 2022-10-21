import React, { useCallback, useRef, useState } from 'react'
import { DragEndEvent, DragMoveEvent, useDndMonitor } from '@dnd-kit/core'
import { Box, SxProps } from '@mui/system'
import { DragTypes } from '../DnDContext'
import { useAppDispatch, useAppSelector } from '@store/index'
import { getEnvelopes } from '@entities/envelope'
import { TEnvelopeId } from '@shared/types'
import { moveEnvelope } from '@entities/envelope/moveEnvelope'

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

export function Highlight() {
  const dispatch = useAppDispatch()
  const OFFSET = 100
  const [isDragging, setIsDragging] = useState(false)

  const envelopes = useAppSelector(getEnvelopes)

  const boxRef = useRef<HTMLDivElement>(null)

  const onDragMove = useCallback(
    (e: DragMoveEvent) => {
      const el = boxRef.current
      if (!el) return
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
        el.style.display = `none`
        return
      }

      if (activeData.type === DragTypes.envelope) {
        const overEnv = envelopes[overData.id as TEnvelopeId]
        const isChild = !!overEnv?.parent
        const isNested = activeRect.left - overRect.left > OFFSET || isChild

        let width = overRect.width - (isNested ? OFFSET : 0)
        let left = overRect.left + (isNested ? OFFSET : 0)
        let top = overRect.top + overRect.height
        el.style.display = `block`
        el.style.width = `${width}px`
        el.style.height = `2px`
        el.style.transform = `translate(${left}px, ${top}px)`
      }

      if (activeData.type === DragTypes.amount) {
        const brdr = 4
        el.style.display = `block`
        el.style.width = `${overRect.width + brdr * 2}px`
        el.style.height = `${overRect.height + brdr * 2}px`
        el.style.transform = `translate(${overRect.left - brdr}px, ${
          overRect.top - brdr
        }px)`
      }
    },
    [envelopes]
  )

  const onDragEnd = useCallback(
    (e: DragEndEvent) => {
      setIsDragging(false)

      const activeData = e.active.data.current
      const overData = e.over?.data.current
      const activeRect = e.active.rect.current.translated
      const overRect = e.over?.rect
      if (
        // has active
        activeData &&
        activeData.id &&
        activeData.type === DragTypes.envelope &&
        activeRect &&
        // has over
        overData &&
        overData.id &&
        overData.type === DragTypes.envelope &&
        overRect &&
        // Not the same
        activeData.id !== overData.id
      ) {
        const isNested = activeRect.left - overRect.left > OFFSET
        dispatch(
          moveEnvelope(activeData.id, envelopes[overData.id].index, isNested)
        )
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
