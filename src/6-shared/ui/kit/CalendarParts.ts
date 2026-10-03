import { cn } from '@/6-shared/ui/shadcn/utils'
import { buttonPressAnimation } from './Button'

/** Shared visual states for date and month cells. */
export function calendarCellClass(states: {
  selected?: boolean
  current?: boolean
  disabled?: boolean
  outside?: boolean
}) {
  return cn(
    'focusable relative flex h-12 w-full items-center justify-center rounded-ui-control-inner rounded-smooth text-ui-16 tabular-nums select-none',
    'hover:bg-ui-highlight active:bg-ui-pressed',
    buttonPressAnimation,
    'motion-reduce:scale-100! motion-reduce:transition-none!',
    states.outside && 'text-ui-secondary',
    states.current &&
      'font-medium after:absolute after:bottom-2 after:size-1 after:rounded-full after:bg-current',
    states.selected &&
      'bg-ui-button-primary text-ui-on-button-primary hover:bg-ui-button-primary active:bg-ui-button-primary',
    states.disabled && 'pointer-events-none opacity-ui-disabled'
  )
}

export const calendarNavClass =
  'relative z-1 rounded-smooth text-ui-secondary aria-disabled:pointer-events-none aria-disabled:opacity-ui-disabled'
export const calendarCaptionClass =
  'flex h-12 min-w-0 items-center justify-center px-2 text-ui-16 font-medium tabular-nums'
