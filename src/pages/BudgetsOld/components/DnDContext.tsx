import React, { FC, ReactNode, useState } from 'react'
import { useAppDispatch } from '@store'
import { DragDropContext, DropResult } from 'react-beautiful-dnd'
import { useMonth } from '@shared/hooks/useMonth'
import { useCallback } from 'react'
import { MoveMoneyModal } from './MoveMoneyModal'
import { moveTag } from '@entities/old-hiddenData/tagOrder'
import { TISOMonth } from '@shared/types'

export type DragModeType = 'FUNDS' | 'REORDER'
type DragModeContextType = {
  dragMode: DragModeType
  setDragMode: (mode: DragModeType) => void
}
interface IMoneyModalProps {
  open: boolean
  source?: string
  destination?: string
  month?: TISOMonth
  key?: string
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
  const [moneyModalProps, setMoneyModalProps] = useState<IMoneyModalProps>({
    open: false,
  })

  const onDragEnd = useCallback(
    (e: DropResult) => {
      setIsDragging(false)
      if (!e.source || !e.destination || !month) return

      if (
        dragMode === 'FUNDS' &&
        e.source.droppableId !== e.destination.droppableId
      ) {
        const source = e.source.droppableId
        const destination = e.destination.droppableId
        setMoneyModalProps({
          open: true,
          source,
          destination,
          month,
          key: source + destination + month,
        })
      }

      if (dragMode === 'REORDER' && e.source.index !== e.destination.index) {
        const startIndex = e.source.index
        const endIndex = e.destination.index
        dispatch(moveTag(startIndex, endIndex))
      }
    },
    [dispatch, dragMode, month]
  )
  const onBeforeCapture = useCallback(() => {
    setIsDragging(true)
    if (window.navigator.vibrate) window.navigator.vibrate(100)
  }, [])
  const closeMoveMoneyModal = useCallback(
    () => setMoneyModalProps({ open: false }),
    []
  )

  return (
    <DragDropContext onDragEnd={onDragEnd} onBeforeCapture={onBeforeCapture}>
      <IsDraggingContext.Provider value={isDragging}>
        <DragModeContext.Provider value={{ dragMode, setDragMode }}>
          {children}
          {/*// @ts-ignore*/}
          <MoveMoneyModal {...moneyModalProps} onClose={closeMoveMoneyModal} />
        </DragModeContext.Provider>
      </IsDraggingContext.Provider>
    </DragDropContext>
  )
}
