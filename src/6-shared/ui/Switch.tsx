import { cn } from './shadcn/utils'

export type SwitchProps = {
  checked?: boolean
  /** Pull the control's padding back off the edge of its row. */
  edge?: 'start' | 'end'
  className?: string
}

/** A decorative switch; the row carries both the click and the state.
 * It is a span
 * rather than an input for that reason — an input inside a button is neither
 * focusable nor announceable in a way that helps.
 *
 * The geometry is a 34x14 track inside 12px of padding, with a 20px
 * thumb that travels 20px. */
export function Switch({ checked, edge, className }: SwitchProps) {
  return (
    <span
      data-slot="switch"
      data-checked={checked || undefined}
      className={cn(
        'relative box-border inline-flex h-[38px] w-[58px] shrink-0 overflow-hidden p-3 align-middle',
        edge === 'start' && '-ml-2',
        edge === 'end' && '-mr-2',
        className
      )}
    >
      <span
        data-slot="switch-track"
        className={cn(
          'h-full w-full rounded-full',
          checked
            ? 'bg-primary opacity-50'
            : 'bg-switch-track opacity-[var(--switch-track-opacity)]'
        )}
      />
      <span
        data-slot="switch-thumb"
        className={cn(
          'absolute top-[9px] left-[9px] size-5 rounded-full bg-current shadow-elevation-1 transition-transform duration-150 ease-in-out',
          checked ? 'translate-x-5 text-primary' : 'text-switch-thumb'
        )}
      />
    </span>
  )
}
