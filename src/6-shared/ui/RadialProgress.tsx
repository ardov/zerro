import type { FC } from 'react'
import React from 'react'
import './RadialProgress.css'

export type RadialProgressProps = React.SVGProps<SVGSVGElement> & {
  size?: number
  value: number
  /** Marks an in-flight step without replacing its determinate value. */
  active?: boolean
}

export const RadialProgress: FC<RadialProgressProps> = ({
  size = 16,
  value,
  active = false,
  ...rest
}) => {
  // A caller dividing by a total it did not check hands over NaN, which would
  // silently become `strokeDasharray="NaN …"` and draw nothing.
  const ratio = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0
  const completed = ratio >= 1
  const colorSuccess = 'var(--success)'
  const colorMain = 'var(--muted-foreground)'

  const r = 12
  const length = 2 * Math.PI * r
  return (
    <svg height={size} width={size} viewBox="0 0 64 64" {...rest}>
      {active && (
        <g className="radial-progress-activity">
          <circle
            r="28"
            cx="32"
            cy="32"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="5 7"
          />
        </g>
      )}
      <circle
        r="30"
        cx="32"
        cy="32"
        stroke={completed ? colorSuccess : colorMain}
        strokeWidth={2}
        opacity={completed ? 0.15 : 1}
        fill={completed ? colorSuccess : 'transparent'}
        style={{ transition: '0.5s ease-out 0.1s' }}
      />

      <circle
        r={r}
        cx="32"
        cy="32"
        opacity="1"
        fill="transparent"
        stroke={completed ? colorSuccess : colorMain}
        strokeWidth={completed ? 0 : r * 2}
        strokeDasharray={`${ratio * length} ${length}`}
        transform="rotate(-90, 32, 32)"
        style={{ transition: '0.5s ease-out' }}
      />

      <path
        d="M16.5 30L28 41.5L47.5 22"
        strokeWidth="6"
        strokeDasharray={completed ? '60 60' : '0 60'}
        stroke={colorSuccess}
        fill="none"
        style={{ transition: `0.3s ease-out ${completed ? 0.4 : 0}s` }}
      />
    </svg>
  )
}
