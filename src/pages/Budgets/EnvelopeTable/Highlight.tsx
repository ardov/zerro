import React, { useCallback, useRef } from 'react'
import { DragEndEvent, DragMoveEvent, useDndMonitor } from '@dnd-kit/core'
import { Box, SxProps } from '@mui/system'
import { DragTypes } from '../DnDContext'
import { useAppDispatch, useAppSelector } from '@store/index'
import { getEnvelopes } from '@entities/envelope'
import { TEnvelopeId } from '@shared/types'
import { moveEnvelope } from '@entities/envelope/moveEnvelope'

const style: SxProps = {
  bgcolor: 'primary.main',
  transition: '0.1s ease-in-out',
  borderRadius: 1,
  position: 'fixed',
  display: 'none',
  top: 0,
  left: 0,
  height: 2,
  width: 100,
  zIndex: 100,
}

export function Highlight() {
  const dispatch = useAppDispatch()
  const OFFSET = 100

  const envelopes = useAppSelector(getEnvelopes)

  const boxRef = useRef<HTMLDivElement>(null)

  const onDragMove = useCallback(
    (e: DragMoveEvent) => {
      const activeData = e.active.data.current
      const overData = e.over?.data.current
      const activeRect = e.active.rect.current.translated
      const overRect = e.over?.rect
      if (
        // has active
        !activeData ||
        !activeData.id ||
        activeData.type !== DragTypes.envelope ||
        !activeRect ||
        // has over
        !overData ||
        !overData.id ||
        overData.type !== DragTypes.envelope ||
        !overRect
      ) {
        if (boxRef?.current?.style) {
          boxRef.current.style.display = `none`
        }
        return
      }
      const overEnv = envelopes[overData.id as TEnvelopeId]
      const isChild = !!overEnv?.parent
      const isNested = activeRect.left - overRect.left > OFFSET || isChild

      if (boxRef?.current?.style) {
        let width = overRect.width - (isNested ? OFFSET : 0)
        let left = overRect.left + (isNested ? OFFSET : 0)
        let top = overRect.top + overRect.height
        boxRef.current.style.display = `block`
        boxRef.current.style.width = `${width}px`
        boxRef.current.style.transform = `translate(${left}px, ${top}px)`
      }
    },
    [envelopes]
  )

  const onDragEnd = useCallback(
    (e: DragEndEvent) => {
      if (boxRef?.current?.style) {
        boxRef.current.style.display = `none`
      }
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
    if (boxRef?.current?.style) {
      boxRef.current.style.display = `none`
    }
  }, [])

  useDndMonitor({
    onDragMove,
    onDragEnd,
    onDragCancel,
  })

  return <Box ref={boxRef} sx={style} />
}
