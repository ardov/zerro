import React, { FC, ReactNode, useState } from 'react'
import { useAppDispatch } from '@store'
import { DragDropContext, DropResult } from 'react-beautiful-dnd'
import { useMonth } from '../model'
import { useCallback } from 'react'
import { MoveMoneyModal } from '@features/moveMoney'
import { moveTag } from '@models/hiddenData/tagOrder'
import { useToggle } from '@shared/hooks/useToggle'
import { TEnvelopeId } from '@shared/types'

export type DragModeType = 'FUNDS' | 'REORDER'
type DragModeContextType = {
  dragMode: DragModeType
  setDragMode: (mode: DragModeType) => void
}

export const IsDraggingContext = React.createContext(false)
export const DragModeContext = React.createContext<DragModeContextType>({
  dragMode: 'FUNDS',
  setDragMode: () => {},
})

export const DnDContext: FC<{ children?: ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch()
  const [month] = useMonth()
  const [isDragging, setIsDragging] = useState(false)
  const [dragMode, setDragMode] = useState<DragModeType>('FUNDS')

  const [moneySource, setMoneySource] =
    useState<TEnvelopeId | 'toBeBudgeted'>('toBeBudgeted')
  const [moneyDestination, setMoneyDestination] =
    useState<TEnvelopeId | 'toBeBudgeted'>('toBeBudgeted')
  const [isOpen, toggleOpen] = useToggle()

  const onDragEnd = useCallback(
    (e: DropResult) => {
      setIsDragging(false)
      if (!e.source || !e.destination || !month) return

      if (
        dragMode === 'FUNDS' &&
        e.source.droppableId !== e.destination.droppableId
      ) {
        setMoneySource(e.source.droppableId as TEnvelopeId)
        setMoneyDestination(e.destination.droppableId as TEnvelopeId)
        toggleOpen()
      }

      if (dragMode === 'REORDER' && e.source.index !== e.destination.index) {
        const startIndex = e.source.index
        const endIndex = e.destination.index
        dispatch(moveTag(startIndex, endIndex))
      }
    },
    [dispatch, dragMode, month, toggleOpen]
  )
  const onBeforeCapture = useCallback(() => {
    setIsDragging(true)
    if (window.navigator.vibrate) window.navigator.vibrate(100)
  }, [])

  return (
    <DragDropContext onDragEnd={onDragEnd} onBeforeCapture={onBeforeCapture}>
      <IsDraggingContext.Provider value={isDragging}>
        <DragModeContext.Provider value={{ dragMode, setDragMode }}>
          {children}
          <MoveMoneyModal
            key={moneySource + moneyDestination + month}
            open={isOpen}
            month={month}
            source={moneySource}
            destination={moneyDestination}
            onClose={toggleOpen}
          />
        </DragModeContext.Provider>
      </IsDraggingContext.Provider>
    </DragDropContext>
  )
}
