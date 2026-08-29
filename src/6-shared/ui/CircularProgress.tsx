import { cn } from './shadcn/utils'
import './CircularProgress.css'

/** Draw in a 44-unit box and show the middle quarter of it, which is
 * why the circle's centre is at 44 rather than 22. */
const BOX = 44
const THICKNESS = 3.6

export type CircularProgressProps = {
  /** Size in pixels. */
  size?: number
  className?: string
  'aria-label'?: string
}

/** An indeterminate arc in the primary color that
 * turns and breathes at the same time. There is no determinate variant here,
 * because nothing in this app knows how far along it is. */
export function CircularProgress({
  size = 40,
  className,
  ...props
}: CircularProgressProps) {
  return (
    <span
      data-slot="circular-progress"
      role="progressbar"
      className={cn(
        'circular-progress inline-block shrink-0 text-primary',
        className
      )}
      style={{ width: size, height: size }}
      {...props}
    >
      <svg className="block" viewBox={`${BOX / 2} ${BOX / 2} ${BOX} ${BOX}`}>
        <circle
          className="circular-progress-arc"
          cx={BOX}
          cy={BOX}
          r={(BOX - THICKNESS) / 2}
          fill="none"
          stroke="currentColor"
          strokeWidth={THICKNESS}
        />
      </svg>
    </span>
  )
}
