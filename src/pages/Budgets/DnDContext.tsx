import React, { FC, ReactNode, useState } from 'react'
import { DndContext, DragOverlay, DragEndEvent } from '@dnd-kit/core'
import { useCallback } from 'react'
import { useMonth } from '@shared/hooks/useMonth'
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
      const active = e.active.data.current
      const over = e.over?.data.current
      if (!active || !over || !month) return
      let dataType = active?.type as DragTypes | undefined
      if (dataType === DragTypes.amount && active.id !== over.id) {
        setMoneySource(active.id as TEnvelopeId)
        setMoneyDestination(over.id as TEnvelopeId)
        toggleOpen()
      }
    },
    [month, toggleOpen]
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
