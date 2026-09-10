import { ButtonBase } from '@/6-shared/ui/Button'
import type { FC, ReactNode } from 'react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { cn } from '@/6-shared/ui/shadcn/utils'
import { Amount } from '@/6-shared/ui/Amount'
import type { DragTypes } from '@/2-pages/Budgets/DnD'

const REVEAL_CELL_WIDTH = 88
const AXIS_DECISION_THRESHOLD = 8
const VELOCITY_THRESHOLD = 0.1 // px/ms

export type RevealItem = {
  key: React.Key
  label: string
  value: number
  /** Tailwind text color utility. */
  color: string
  onClick?: (e: React.MouseEvent<HTMLElement>) => void
  draggable?: {
    type: DragTypes
    id: string
    disabled?: boolean
  }
}

type SlideRevealProps = {
  enabled: boolean
  items: RevealItem[]
  children: ReactNode
}

type DragState = {
  x: number
  y: number
  startOffset: number
  axis: 'h' | 'v' | null
  lastX: number
  lastTime: number
  velocityX: number
}

function useSlideRevealGesture(revealWidth: number) {
  const [offsetX, setOffsetX] = useState(0)
  // Keep a ref so pointer handlers always see the current value without
  // needing offsetX in their dependency arrays.
  const offsetXRef = useRef(offsetX)
  useEffect(() => {
    offsetXRef.current = offsetX
  }, [offsetX])

  const updateOffset = useCallback((next: number) => {
    offsetXRef.current = next
    setOffsetX(next)
  }, [])

  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<DragState | null>(null)

  // Clamp or close when the panel width changes (column switch, breakpoint).
  const [prevRevealWidth, setPrevRevealWidth] = useState(revealWidth)
  if (prevRevealWidth !== revealWidth) {
    setPrevRevealWidth(revealWidth)
    setOffsetX(prev =>
      prev === 0 ? 0 : Math.max(-revealWidth, Math.min(0, prev))
    )
  }

  const closeReveal = useCallback(() => updateOffset(0), [updateOffset])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!revealWidth) return
      e.currentTarget.setPointerCapture(e.pointerId)
      dragRef.current = {
        x: e.clientX,
        y: e.clientY,
        startOffset: offsetXRef.current,
        axis: null,
        lastX: e.clientX,
        lastTime: Date.now(),
        velocityX: 0,
      }
      setIsDragging(true)
    },
    [revealWidth]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const t = dragRef.current
      if (!t) return
      const dx = e.clientX - t.x
      const dy = e.clientY - t.y
      if (!t.axis) {
        if (
          Math.abs(dx) < AXIS_DECISION_THRESHOLD &&
          Math.abs(dy) < AXIS_DECISION_THRESHOLD
        )
          return
        t.axis = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v'
      }
      if (t.axis !== 'h') return
      const now = Date.now()
      const elapsed = now - t.lastTime
      if (elapsed > 0) t.velocityX = (e.clientX - t.lastX) / elapsed
      t.lastX = e.clientX
      t.lastTime = now
      const next = Math.min(0, Math.max(-revealWidth, t.startOffset + dx))
      updateOffset(next)
    },
    [revealWidth, updateOffset]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const t = dragRef.current
      setIsDragging(false)
      dragRef.current = null
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
      if (!t || t.axis !== 'h') return
      const elapsed = Date.now() - t.lastTime
      const releaseVelocity =
        elapsed > 0 && e.clientX !== t.lastX
          ? (e.clientX - t.lastX) / elapsed
          : t.velocityX
      const velocity = elapsed <= 100 ? releaseVelocity : 0
      const shouldOpen =
        Math.abs(velocity) > VELOCITY_THRESHOLD
          ? velocity < 0
          : offsetXRef.current < -revealWidth / 2
      updateOffset(shouldOpen ? -revealWidth : 0)
    },
    [revealWidth, updateOffset]
  )

  return {
    offsetX,
    isDragging,
    closeReveal,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  }
}

export const SlideReveal: FC<SlideRevealProps> = ({
  enabled,
  items,
  children,
}) => {
  const revealWidth = enabled ? items.length * REVEAL_CELL_WIDTH : 0
  const {
    offsetX,
    isDragging,
    closeReveal,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useSlideRevealGesture(revealWidth)

  if (!revealWidth) return <>{children}</>

  const isOpen = offsetX !== 0

  return (
    <div className="relative overflow-hidden">
      <div
        className="relative"
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        <div
          className="relative touch-pan-y"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {children}
          {isOpen && (
            <div
              onClick={closeReveal}
              className="absolute inset-0 cursor-pointer"
            />
          )}
        </div>

        <div className="absolute bottom-0 left-full top-0 flex items-stretch">
          {items.map(item => (
            <RevealCell
              key={item.key}
              item={item}
              onClick={e => {
                item.onClick?.(e)
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

const revealCellClassName =
  'flex w-[88px] flex-col items-center justify-center border-l border-border bg-accent px-2'

type CellProps = {
  item: RevealItem
  onClick: (e: React.MouseEvent<HTMLElement>) => void
}

const RevealCell: FC<CellProps> = ({ item, onClick }) =>
  item.draggable ? (
    <DraggableRevealCell item={item} onClick={onClick} drag={item.draggable} />
  ) : (
    <ButtonBase onClick={onClick} className={revealCellClassName}>
      <RevealCellContent
        label={item.label}
        value={item.value}
        color={item.color}
      />
    </ButtonBase>
  )

const DraggableRevealCell: FC<
  CellProps & { drag: NonNullable<RevealItem['draggable']> }
> = ({ item, onClick, drag }) => {
  const { setNodeRef, attributes, listeners } = useDraggable({
    id: 'reveal-' + drag.type + '-' + drag.id,
    disabled: !!drag.disabled,
    data: { type: drag.type, id: drag.id },
  })
  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      {...attributes}
      {...listeners}
      className={`${revealCellClassName} ${drag.disabled ? 'cursor-pointer' : 'cursor-grab'} select-none touch-manipulation active:bg-focus-surface`}
    >
      <RevealCellContent
        label={item.label}
        value={item.value}
        color={item.color}
      />
    </div>
  )
}

const RevealCellContent: FC<{
  label: string
  value: number
  color: string
}> = ({ label, value, color }) => (
  <>
    <span className="truncate text-caption font-sans leading-[1.2] text-muted-foreground">
      {label}
    </span>
    <p className={cn('m-0 truncate text-body-sm font-sans', color)}>
      <Amount value={value} decimals="ifOnly" />
    </p>
  </>
)
