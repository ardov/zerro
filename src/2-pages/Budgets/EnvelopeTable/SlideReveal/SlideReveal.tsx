import React, { FC, ReactNode, useCallback, useRef, useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { Box, SxProps, Theme, Typography } from '@mui/material'
import { Amount } from '6-shared/ui/Amount'
import { DragTypes } from '2-pages/Budgets/DnD'

const REVEAL_CELL_WIDTH = 88
const AXIS_DECISION_THRESHOLD = 8

export type RevealItem = {
  key: React.Key
  label: string
  value: number
  color: string
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
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

export const SlideReveal: FC<SlideRevealProps> = ({
  enabled,
  items,
  children,
}) => {
  const revealWidth = enabled ? items.length * REVEAL_CELL_WIDTH : 0
  const [offsetX, setOffsetX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const touchRef = useRef<{
    x: number
    y: number
    startOffset: number
    axis: 'h' | 'v' | null
  } | null>(null)

  const closeReveal = useCallback(() => setOffsetX(0), [])

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!revealWidth) return
    const touch = e.touches[0]
    touchRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      startOffset: offsetX,
      axis: null,
    }
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const t = touchRef.current
    if (!t) return
    const touch = e.touches[0]
    const dx = touch.clientX - t.x
    const dy = touch.clientY - t.y
    if (!t.axis) {
      if (
        Math.abs(dx) < AXIS_DECISION_THRESHOLD &&
        Math.abs(dy) < AXIS_DECISION_THRESHOLD
      )
        return
      t.axis = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v'
    }
    if (t.axis !== 'h') return
    const next = Math.min(0, Math.max(-revealWidth, t.startOffset + dx))
    setOffsetX(next)
  }

  const handleTouchEnd = () => {
    const t = touchRef.current
    setIsDragging(false)
    touchRef.current = null
    if (!t || t.axis !== 'h') return
    setOffsetX(prev => (prev < -revealWidth / 2 ? -revealWidth : 0))
  }

  if (!revealWidth) return <>{children}</>

  const isOpen = offsetX !== 0

  return (
    <Box sx={{ overflow: 'hidden', position: 'relative' }}>
      <Box
        sx={{
          position: 'relative',
          transform: `translateX(${offsetX}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          touchAction: 'pan-y',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {children}
        {isOpen && (
          <Box
            onClick={closeReveal}
            sx={{ position: 'absolute', inset: 0, cursor: 'pointer' }}
          />
        )}
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
                closeReveal()
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
  '&:active': { bgcolor: 'action.focus' },
}

type CellProps = {
  item: RevealItem
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void
}

const RevealCell: FC<CellProps> = ({ item, onClick }) =>
  item.draggable ? (
    <DraggableRevealCell item={item} onClick={onClick} drag={item.draggable} />
  ) : (
    <Box onClick={onClick} sx={{ ...revealCellSx, cursor: 'pointer' }}>
      <RevealCellContent
        label={item.label}
        value={item.value}
        color={item.color}
      />
    </Box>
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
      <Amount value={value} decMode="ifOnly" />
    </Typography>
  </>
)
