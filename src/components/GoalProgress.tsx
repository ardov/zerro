import React, { FC } from 'react'
import { useTheme } from '@material-ui/core'

type GoalProgressProps = React.SVGProps<SVGSVGElement> & {
  size?: number
  value: number
}

export const GoalProgress: FC<GoalProgressProps> = ({
  size = 16,
  value,
  ...rest
}) => {
  value = value < 0 ? 0 : value
  const completed = value >= 1
  const theme = useTheme()
  const colorSuccess = theme.palette.success.main
  const colorMain = theme.palette.text.secondary

  const r = 12
  const length = 2 * Math.PI * r
  return (
    <svg height={size} width={size} viewBox="0 0 64 64" {...rest}>
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

      <g transform="">
        <circle
          r={r}
          cx="32"
          cy="32"
          opacity="1"
          fill="transparent"
          stroke={completed ? colorSuccess : colorMain}
          strokeWidth={completed ? 0 : r * 2}
          strokeDasharray={`${value * length} ${length}`}
          transform={`rotate(${completed ? 0 : -90}, 32, 32)`}
          style={{ transition: '0.5s ease-out' }}
        />
      </g>

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
