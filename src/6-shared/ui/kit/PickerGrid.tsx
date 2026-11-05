import { useState, type FocusEvent, type KeyboardEvent } from 'react'
import { cn } from '../shadcn/utils'
import { IconButton, type IconButtonProps } from './Button'

const columns = 6
const cells = (grid: HTMLElement) =>
  Array.from(grid.querySelectorAll<HTMLElement>(':scope > button'))

/** Tab enters each grid once; arrows follow its six-column layout. Up and
 * Down at an edge continue into the neighbouring `[data-picker-grid]` within
 * a `[data-picker-grids]` container. Spread `gridProps` on the grid element. */
export function usePickerGrid(count: number) {
  const [active, setActive] = useState(0)
  // Events from the nested dropdown bubble here through the React tree;
  // they are not cells, so `indexOf` skips them.
  function onFocus(event: FocusEvent<HTMLDivElement>) {
    const index = cells(event.currentTarget).indexOf(event.target)
    if (index >= 0) setActive(index)
  }
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const grid = event.currentTarget
    const buttons = cells(grid)
    const index = buttons.indexOf(event.target as HTMLElement)
    if (index < 0 || event.altKey || event.ctrlKey || event.metaKey) return
    const column = index % columns
    let next: HTMLElement | undefined
    switch (event.key) {
      case 'ArrowRight':
        next = buttons[index + 1]
        break
      case 'ArrowLeft':
        next = buttons[index - 1]
        break
      case 'Home':
        next = buttons[0]
        break
      case 'End':
        next = buttons.at(-1)
        break
      case 'ArrowUp':
      case 'ArrowDown': {
        const down = event.key === 'ArrowDown'
        const rowStart = index - column + (down ? columns : -columns)
        if (rowStart >= 0 && rowStart < buttons.length) {
          next = buttons[Math.min(rowStart + column, buttons.length - 1)]
        } else {
          const grids = Array.from(
            grid
              .closest('[data-picker-grids]')
              ?.querySelectorAll<HTMLElement>('[data-picker-grid]') ?? []
          )
          const sibling = grids[grids.indexOf(grid) + (down ? 1 : -1)]
          if (sibling) {
            const other = cells(sibling)
            const row = down
              ? 0
              : Math.floor((other.length - 1) / columns) * columns
            next = other[Math.min(row + column, other.length - 1)]
          }
        }
        break
      }
      default:
        return
    }
    event.preventDefault()
    next?.focus()
  }
  return {
    gridProps: {
      'data-picker-grid': '',
      className: 'grid grid-cols-6 gap-1',
      onFocus,
      onKeyDown,
    },
    tabIndex: (index: number) =>
      index === Math.min(active, count - 1) ? 0 : -1,
  }
}

/** A round picker cell that fills its grid column. */
export function PickerGridButton(props: Omit<IconButtonProps, 'shape'>) {
  const { className, ...restProps } = props
  return (
    <IconButton
      shape="circle"
      variant="ghost"
      size="sm"
      tooltip={false}
      className={cn('size-auto aspect-square min-h-10', className)}
      {...restProps}
    />
  )
}
