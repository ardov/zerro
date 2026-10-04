import type { SVGProps } from 'react'
import './RadialProgress.css'

export type RadialProgressProps = SVGProps<SVGSVGElement> & {
  size?: number
  /** Omit when the amount of work is unknown. Numeric values range from 0 to 1. */
  value?: number
  /** Marks an in-flight step without replacing its determinate value. */
  active?: boolean
}

export function RadialProgress(props: RadialProgressProps) {
  const { size = 16, value, active = false, style, ...restProps } = props
  const accessible = !!(restProps['aria-label'] || restProps['aria-labelledby'])
  const indeterminate = value === undefined
  const moving = indeterminate || active
  // A caller dividing by a total it did not check hands over NaN, which would
  // silently become `strokeDasharray="NaN …"` and draw nothing.
  const ratio =
    value !== undefined && Number.isFinite(value)
      ? Math.min(1, Math.max(0, value))
      : 0
  const completed = !indeterminate && ratio >= 1
  const colorSuccess = 'var(--color-ui-success)'
  const colorMain = 'var(--color-ui-secondary)'

  const r = 12
  const length = 2 * Math.PI * r
  return (
    <svg
      height={size}
      width={size}
      viewBox="0 0 64 64"
      role={accessible ? 'progressbar' : undefined}
      aria-hidden={accessible ? undefined : true}
      aria-valuemin={accessible ? 0 : undefined}
      aria-valuemax={accessible ? 1 : undefined}
      aria-valuenow={accessible && !indeterminate ? ratio : undefined}
      {...restProps}
      /* The global `svg { max-width: 100% }` reset shrinks this icon's width
         alone when its button is narrower than `size`, distorting the circle.
         A fixed-size UI icon isn't responsive content, so it opts out. */
      style={{ maxWidth: 'none', flexShrink: 0, ...style }}
    >
      <circle
        className={'radial-progress-activity'}
        r="30"
        cx="32"
        cy="32"
        stroke={moving ? colorMain : completed ? colorSuccess : colorMain}
        strokeWidth={moving ? 3 : 2}
        strokeDasharray={moving ? '8 16' : '24 0'}
        strokeLinecap="round"
        opacity={moving ? 1 : completed ? 0.15 : 1}
        fill={completed ? colorSuccess : 'transparent'}
      />

      <circle
        r={r}
        cx="32"
        cy="32"
        opacity={indeterminate ? 0 : 1}
        fill="transparent"
        stroke={completed ? colorSuccess : colorMain}
        strokeWidth={completed ? 0 : r * 2}
        strokeDasharray={`${ratio * length} ${length}`}
        transform="rotate(-90, 32, 32)"
      />

      <path
        d="M16.5 30L28 41.5L47.5 22"
        strokeWidth="6"
        strokeDasharray={completed ? '60 60' : '0 60'}
        stroke={colorSuccess}
        fill="none"
        data-completed={completed || undefined}
      />
    </svg>
  )
}
