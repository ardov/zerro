import React, { useState } from 'react'
import { DragMoveEvent, useDndMonitor } from '@dnd-kit/core'
import { Box } from '@mui/system'
import { DragTypes } from '../DnDContext'
import { useAppDispatch, useAppSelector } from '@store/index'
import { getEnvelopes } from '@entities/envelope'
import { TEnvelopeId } from '@shared/types'
import { moveEnvelope } from '@entities/envelope/moveEnvelope'

export function Highlight() {
  const dispatch = useAppDispatch()
  const OFFSET = 56

  const envelopes = useAppSelector(getEnvelopes)

  const [rect, setRect] = useState<number[] | null>(null)
  const [isNested, setIsNested] = useState<boolean>(false)

  useDndMonitor({
    onDragMove: updatePos,
    onDragEnd: e => {
      const activeData = e.active.data.current
      const overData = e.over?.data.current
      if (
        // has active
        activeData &&
        activeData.id &&
        activeData.type === DragTypes.envelope &&
        // has over
        overData &&
        overData.id &&
        overData.type === DragTypes.envelope &&
        // Not the same
        activeData.id !== overData.id
      ) {
        dispatch(
          moveEnvelope(activeData.id, envelopes[overData.id].index, isNested)
        )
      }
      setRect(null)
    },
    onDragCancel: e => setRect(null),
  })

  return rect ? (
    <Box
      sx={{
        bgcolor: 'primary.main',
        transition: '0.1s ease-in-out',
        borderRadius: 1,
        position: 'fixed',
        height: 2,
        left: rect[0],
        top: rect[1],
        width: rect[2],
        zIndex: 100,
      }}
    />
  ) : null

  function updatePos(e: DragMoveEvent) {
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
      return setRect(null)
    }
    const overEnv = envelopes[overData.id as TEnvelopeId]
    const isChild = !!overEnv?.parent
    const isNested = activeRect.left - overRect.left > OFFSET || isChild
    setIsNested(isNested)
    setRect([
      overRect.left + (isNested ? OFFSET : 0),
      overRect.top + overRect.height,
      overRect.width - (isNested ? OFFSET : 0),
    ])
  }
}
