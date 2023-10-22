import { createPortal } from 'react-dom'
import React, { FC, ReactNode, useState } from 'react'
import { useCallback } from 'react'
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
import { useTranslation } from 'react-i18next'
import { Box, SxProps } from '@mui/system'
import { Typography } from '@mui/material'
import { useToggle } from '6-shared/hooks/useToggle'
import { useAppDispatch } from 'store/index'
import { envelopeModel, TEnvelopeId } from '5-entities/envelope'
import { MoveMoneyModal } from '4-features/moveMoney'
import { assignNewGroup } from '4-features/envelope/assignNewGroup'
import { useMonth } from './MonthProvider'

export enum DragTypes {
  newGroup = 'newGroup',
  amount = 'amount',
  envelope = 'envelope',
}

export type TDragData = {
  type: DragTypes
  id: TEnvelopeId
  isExpanded?: boolean
  isLastVisibleChild?: boolean
}

const vibrate = () => window?.navigator?.vibrate?.(100)
const autoscrollOptions = { threshold: { x: 0, y: 0.2 } }
const touchSensorOptions = {
  activationConstraint: { delay: 250, tolerance: 5 },
}

export const DnDContext: FC<{ children?: ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch()
  const [month] = useMonth()

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, touchSensorOptions),
    useSensor(KeyboardSensor)
  )

  const [moneySource, setMoneySource] = useState<TEnvelopeId | 'toBeBudgeted'>(
    'toBeBudgeted'
  )
  const [moneyDestination, setMoneyDestination] = useState<
    TEnvelopeId | 'toBeBudgeted'
  >('toBeBudgeted')
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
      if (
        active?.type === DragTypes.envelope &&
        active?.id &&
        over?.type === DragTypes.newGroup
      ) {
        dispatch(assignNewGroup(active.id))
      }
    },
    [dispatch, month, toggleOpen]
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
        key={moneySource + moneyDestination + month + isOpen}
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
  const { t } = useTranslation('common')
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
      <Box sx={props}>{t('moneyDnd')}</Box>
    ) : activeType === DragTypes.envelope ? (
      <Box sx={props}>
        <Typography noWrap>
          {activeId ? envelopes[activeId].name : t('category')}
        </Typography>
      </Box>
    ) : null

  return createPortal(<DragOverlay>{content}</DragOverlay>, document.body)
}
