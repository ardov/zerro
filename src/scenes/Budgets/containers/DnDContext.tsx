import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { DragDropContext, DropResult } from 'react-beautiful-dnd'
import { useMonth } from '../useMonth'
import { useCallback } from 'react'
import { MoveMoneyModal } from './MoveMoneyModal'
import { moveTag } from 'store/localData/hiddenData/tagOrder'

export type DragModeType = 'FUNDS' | 'REORDER'
type DragModeContextType = {
  dragMode: DragModeType
  setDragMode: (mode: DragModeType) => void
}
interface IMoneyModalProps {
  open: boolean
  source?: string
  destination?: string
  month?: number
  key?: string
}

export const IsDraggingContext = React.createContext(false)
export const DragModeContext = React.createContext({
  dragMode: 'FUNDS',
  setDragMode: () => {},
} as DragModeContextType)

export const DnDContext: React.FC = ({ children }) => {
  const dispatch = useDispatch()
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
  const onDragStart = useCallback(e => {
    setIsDragging(true)
    if (window.navigator.vibrate) window.navigator.vibrate(100)
  }, [])
  const closeMoveMoneyModal = useCallback(
    () => setMoneyModalProps({ open: false }),
    []
  )

  return (
    <DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
      <IsDraggingContext.Provider value={isDragging}>
        <DragModeContext.Provider value={{ dragMode, setDragMode }}>
          {children}
          <MoveMoneyModal {...moneyModalProps} onClose={closeMoveMoneyModal} />
        </DragModeContext.Provider>
      </IsDraggingContext.Provider>
    </DragDropContext>
  )
}
