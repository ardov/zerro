import React, { FC, ReactNode, useState } from 'react'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { useAppDispatch } from '@store'
import { useMonth } from '../model'
import { useCallback } from 'react'
import { MoveMoneyModal } from '@features/moveMoney'
import { useToggle } from '@shared/hooks/useToggle'
import { TEnvelopeId } from '@shared/types'

export enum DragTypes {
  amount = 'amount',
  envelope = 'envelope',
}

export const DnDContext: FC<{ children?: ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch()
  const [month] = useMonth()

  const [moneySource, setMoneySource] =
    useState<TEnvelopeId | 'toBeBudgeted'>('toBeBudgeted')
  const [moneyDestination, setMoneyDestination] =
    useState<TEnvelopeId | 'toBeBudgeted'>('toBeBudgeted')
  const [isOpen, toggleOpen] = useToggle()

  const onDragEnd = useCallback(
    (e: DragEndEvent) => {
      // activatorEvent: Event;
      // active: Active;
      // collisions: Collision[] | null;
      // delta: Translate;
      // over: Over | null;

      console.log('dropped', e)

      if (!e.active || !e.over || !month) return

      let dataType = e.active.data.current?.type as DragTypes | undefined

      if (dataType === DragTypes.amount && e.active.id !== e.over.id) {
        setMoneySource(e.active.id as TEnvelopeId)
        setMoneyDestination(e.over.id as TEnvelopeId)
        toggleOpen()
      }

      // if (dragMode === 'REORDER' && e.source.index !== e.destination.index) {
      //   const startIndex = e.source.index
      //   const endIndex = e.destination.index
      //   dispatch(moveTag(startIndex, endIndex))
      // }
    },
    [dispatch, month, toggleOpen]
  )
  const onDragStart = useCallback(() => {
    if (window.navigator.vibrate) window.navigator.vibrate(100)
  }, [])

  return (
    <DndContext
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      autoScroll={{ threshold: { x: 0, y: 0.2 } }}
    >
      {children}
      <MoveMoneyModal
        key={moneySource + moneyDestination + month}
        open={isOpen}
        month={month}
        source={moneySource}
        destination={moneyDestination}
        onClose={toggleOpen}
      />
    </DndContext>
  )
}
