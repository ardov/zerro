import React, { FC, ReactNode, useState } from 'react'
import {
  useDndMonitor,
  useSensor,
  useSensors,
  DndContext,
  DragOverlay,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
} from '@dnd-kit/core'
import { useCallback } from 'react'
import { useMonth } from '@shared/hooks/useMonth'
import { MoveMoneyModal } from '@features/moveMoney'
import { useToggle } from '@shared/hooks/useToggle'
import { TEnvelopeId } from '@shared/types'
import { Box, SxProps } from '@mui/system'
import { useAppSelector } from '@store/index'
import { Typography } from '@mui/material'
import { createPortal } from 'react-dom'
import { envelopeModel } from '@entities/envelope'

export enum DragTypes {
  amount = 'amount',
  envelope = 'envelope',
}

export type TDragData = {
  type: DragTypes
  id: TEnvelopeId
  isExpanded?: boolean
  isLastVisibleChild?: boolean
}

const autoscrollOptions = { threshold: { x: 0, y: 0.2 } }
const vibrate = () => window?.navigator?.vibrate?.(100)

export const DnDContext: FC<{ children?: ReactNode }> = ({ children }) => {
  const [month] = useMonth()

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor)
  )

  const [moneySource, setMoneySource] =
    useState<TEnvelopeId | 'toBeBudgeted'>('toBeBudgeted')
  const [moneyDestination, setMoneyDestination] =
    useState<TEnvelopeId | 'toBeBudgeted'>('toBeBudgeted')
  const [isOpen, toggleOpen] = useToggle()

  const onDragEnd = useCallback(
    (e: DragEndEvent) => {
      const active = e.active.data.current as TDragData
      const over = e.over?.data.current as TDragData
      if (!active || !over || !month) return
      let dataType = active?.type
      if (dataType === DragTypes.amount && active.id !== over.id) {
        setMoneySource(active.id)
        setMoneyDestination(over.id)
        toggleOpen()
      }
    },
    [month, toggleOpen]
  )

  return (
    <DndContext
      sensors={sensors}
      onDragStart={vibrate}
      onDragEnd={onDragEnd}
      autoScroll={autoscrollOptions}
    >
      {children}
      <DragObj />
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

const props: SxProps = {
  position: 'absolute',
  display: 'flex',
  bgcolor: 'background.default',
  py: 0.5,
  px: 2,
  borderRadius: 1,
  width: 'auto',
  cursor: 'grabbing',
  userSelect: 'none',
  transform: 'scale(1.3)',
}

const DragObj = () => {
  const [activeType, setActiveType] = useState<DragTypes>(DragTypes.amount)
  const [activeId, setActiveId] = useState<TEnvelopeId>()
  const envelopes = envelopeModel.useEnvelopes()

  useDndMonitor({
    onDragStart(e) {
      const activeData = e.active.data.current
      if (!activeData) return
      setActiveType(activeData.type)
      setActiveId(activeData.id)
    },
  })

  const content =
    activeType === DragTypes.amount ? (
      <Box sx={props}>Денюшки</Box>
    ) : activeType === DragTypes.envelope ? (
      <Box sx={props}>
        <Typography noWrap>
          {activeId ? envelopes[activeId].name : 'Конверт'}
        </Typography>
      </Box>
    ) : null

  return createPortal(<DragOverlay>{content}</DragOverlay>, document.body)
}
