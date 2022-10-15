import React, { FC, ReactNode, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  DragEndEvent,
  useDndMonitor,
} from '@dnd-kit/core'
import { useCallback } from 'react'
import { useMonth } from '@shared/hooks/useMonth'
import { MoveMoneyModal } from '@features/moveMoney'
import { useToggle } from '@shared/hooks/useToggle'
import { TEnvelopeId } from '@shared/types'
import { Box, SxProps } from '@mui/system'
import { useAppSelector } from '@store/index'
import { getMonthTotals } from '@entities/envelopeData'
import { Typography } from '@mui/material'

export enum DragTypes {
  amount = 'amount',
  envelope = 'envelope',
}

const autoscrollOptions = { threshold: { x: 0, y: 0.2 } }
const vibrate = () => window?.navigator?.vibrate(100)

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

  return (
    <DndContext
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
}

const DragObj = () => {
  const [month] = useMonth()
  const [activeType, setActiveType] = useState<DragTypes>(DragTypes.amount)
  const [activeId, setActiveId] = useState<TEnvelopeId>()
  const totals = useAppSelector(getMonthTotals)[month]
  const env = activeId && totals.envelopes[activeId]

  useDndMonitor({
    onDragStart(e) {
      const activeData = e.active.data.current
      if (!activeData) return
      setActiveType(activeData.type)
      setActiveId(activeData.id)
    },
  })

  if (!env)
    return (
      <DragOverlay>
        <Box sx={props}>
          {activeType === DragTypes.amount ? 'Денюшки' : 'Конверт'}
        </Box>
      </DragOverlay>
    )

  if (activeType === DragTypes.amount)
    return (
      <DragOverlay>
        <Box sx={props}>Денюшки</Box>
      </DragOverlay>
    )

  if (activeType === DragTypes.envelope)
    return (
      <DragOverlay>
        <Box sx={props}>
          <Typography noWrap>{env.env.name}</Typography>
        </Box>
      </DragOverlay>
    )

  return null
}
