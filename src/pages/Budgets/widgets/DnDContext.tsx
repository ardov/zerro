import React, { FC, ReactNode, useState } from 'react'
import { DndContext, DragOverlay, DragEndEvent } from '@dnd-kit/core'
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
  const [month] = useMonth()

  const [moneySource, setMoneySource] =
    useState<TEnvelopeId | 'toBeBudgeted'>('toBeBudgeted')
  const [moneyDestination, setMoneyDestination] =
    useState<TEnvelopeId | 'toBeBudgeted'>('toBeBudgeted')
  const [isOpen, toggleOpen] = useToggle()

  const onDragEnd = useCallback(
    (e: DragEndEvent) => {
      if (!e.active || !e.over || !month) return
      let dataType = e.active.data.current?.type as DragTypes | undefined
      if (dataType === DragTypes.amount && e.active.id !== e.over.id) {
        setMoneySource(e.active.id as TEnvelopeId)
        setMoneyDestination(e.over.id as TEnvelopeId)
        toggleOpen()
      }
    },
    [month, toggleOpen]
  )
  const onDragStart = useCallback(() => {
    console.log('Started')

    if (window.navigator.vibrate) window.navigator.vibrate(100)
  }, [])

  return (
    <DndContext
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      autoScroll={{ threshold: { x: 0, y: 0.2 } }}
    >
      {children}
      <DragOverlay>Денюшки</DragOverlay>
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
