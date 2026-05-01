import React, {
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useDraggable } from '@dnd-kit/core'
import { Box, ButtonBase, SxProps, Theme, Typography } from '@mui/material'
import { Amount } from '6-shared/ui/Amount'
import { DragTypes } from '2-pages/Budgets/DnD'

const REVEAL_CELL_WIDTH = 88
const AXIS_DECISION_THRESHOLD = 8
const VELOCITY_THRESHOLD = 0.1 // px/ms

export type RevealItem = {
  key: React.Key
  label: string
  value: number
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
}

function useSlideRevealGesture(revealWidth: number) {
  const [offsetX, setOffsetX] = useState(0)
  // Keep a ref so pointer handlers always see the current value without
  // needing offsetX in their dependency arrays.
  const offsetXRef = useRef(offsetX)
  offsetXRef.current = offsetX

  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<DragState | null>(null)

  // Clamp or close when the panel width changes (column switch, breakpoint).
  useEffect(() => {
    setOffsetX(prev =>
      prev === 0 ? 0 : Math.max(-revealWidth, Math.min(0, prev))
    )
  }, [revealWidth])

  const closeReveal = useCallback(() => setOffsetX(0), [])

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
      t.lastX = e.clientX
      t.lastTime = Date.now()
      const next = Math.min(0, Math.max(-revealWidth, t.startOffset + dx))
      setOffsetX(next)
    },
    [revealWidth]
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
      const velocity = elapsed > 0 ? (e.clientX - t.lastX) / elapsed : 0
      const shouldOpen =
        velocity < -VELOCITY_THRESHOLD || offsetXRef.current < -revealWidth / 2
      setOffsetX(shouldOpen ? -revealWidth : 0)
    },
    [revealWidth]
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
    <Box sx={{ overflow: 'hidden', position: 'relative' }}>
      <Box
        sx={{
          position: 'relative',
          transform: `translateX(${offsetX}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        <Box
          sx={{ touchAction: 'pan-y', position: 'relative' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {children}
          {isOpen && (
            <Box
              onClick={closeReveal}
              sx={{ position: 'absolute', inset: 0, cursor: 'pointer' }}
            />
          )}
        </Box>

        <Box
          sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: '100%',
            display: 'flex',
            alignItems: 'stretch',
          }}
        >
          {items.map(item => (
            <RevealCell
              key={item.key}
              item={item}
              onClick={e => {
                item.onClick?.(e)
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  )
}

const revealCellSx: SxProps<Theme> = {
  width: REVEAL_CELL_WIDTH,
  px: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  bgcolor: 'action.hover',
  borderLeft: theme => `1px solid ${theme.palette.divider}`,
}

type CellProps = {
  item: RevealItem
  onClick: (e: React.MouseEvent<HTMLElement>) => void
}

const RevealCell: FC<CellProps> = ({ item, onClick }) =>
  item.draggable ? (
    <DraggableRevealCell item={item} onClick={onClick} drag={item.draggable} />
  ) : (
    <ButtonBase onClick={onClick} sx={revealCellSx}>
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
    <Box
      ref={setNodeRef}
      onClick={onClick}
      {...attributes}
      {...listeners}
      sx={{
        ...revealCellSx,
        cursor: drag.disabled ? 'pointer' : 'grab',
        userSelect: 'none',
        touchAction: 'manipulation',
        '&:active': { bgcolor: 'action.focus' },
      }}
    >
      <RevealCellContent
        label={item.label}
        value={item.value}
        color={item.color}
      />
    </Box>
  )
}

const RevealCellContent: FC<{
  label: string
  value: number
  color: string
}> = ({ label, value, color }) => (
  <>
    <Typography
      variant="caption"
      color="text.secondary"
      noWrap
      sx={{ lineHeight: 1.2 }}
    >
      {label}
    </Typography>
    <Typography variant="body2" noWrap sx={{ color }}>
      <Amount value={value} decimals="ifOnly" />
    </Typography>
  </>
)
