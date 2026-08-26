import { createPortal } from 'react-dom'
import type { FC, ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useCallback } from 'react'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  useDndMonitor,
  useSensor,
  useSensors,
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
} from '@dnd-kit/core'
import { useTranslation } from 'react-i18next'
import { useToggle } from '6-shared/hooks/useToggle'
import { useAppDispatch, useAppSelector } from 'store/index'
import { core } from 'zerro-core/redux'

import { MoveMoneyModal } from '4-features/moveMoney'
import { assignNewGroup } from '4-features/envelope/assignNewGroup'
import { useMonth } from '../MonthProvider'
import type { TDragData } from './dragTypes'
import { DragTypes } from './dragTypes'
import { Highlight } from './Highlight'

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

  const [moneySource, setMoneySource] = useState<
    core.envelopes.TEnvelopeId | 'toBeAssigned'
  >('toBeAssigned')
  const [moneyDestination, setMoneyDestination] = useState<
    core.envelopes.TEnvelopeId | 'toBeAssigned'
  >('toBeAssigned')
  const [isOpen, toggleOpen] = useToggle()

  const onDragEnd = useCallback(
    (e: DragEndEvent) => {
      const active = e.active.data.current as TDragData
      const over = e.over?.data.current as TDragData
      if (!active || !over || !month) return
      const dataType = active?.type
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
      <Highlight />
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

let moniesRenderCount = 0
const Monies = () => {
  const { t } = useTranslation('common')
  useEffect(() => {
    moniesRenderCount = (moniesRenderCount + 1) % 7
  }, [])
  return (
    <div className="absolute flex w-auto scale-[1.3] cursor-grabbing select-none rounded-lg bg-background px-4 py-1">
      {t('moneyDnd', { context: String(moniesRenderCount) })}
    </div>
  )
}

const DragObj = () => {
  const { t } = useTranslation('common')
  const [activeType, setActiveType] = useState<DragTypes>(DragTypes.amount)
  const [activeId, setActiveId] = useState<core.envelopes.TEnvelopeId>()
  const envelopes = useAppSelector(core.envelopes.selectAll)

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
      <Monies />
    ) : activeType === DragTypes.envelope ? (
      <div className="absolute flex w-auto scale-[1.3] cursor-grabbing select-none rounded-lg bg-background px-4 py-1">
        <p className="m-0 truncate type-body">
          {activeId ? envelopes[activeId].name : t('category')}
        </p>
      </div>
    ) : null

  return createPortal(<DragOverlay>{content}</DragOverlay>, document.body)
}
