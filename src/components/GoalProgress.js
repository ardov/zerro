import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { useTheme } from '@material-ui/styles'

const useStyles = makeStyles({
  check: {
    transition: ({ completed }) => `0.3s ease-out ${completed ? 0.3 : 0}s`,
  },
  inner: { transition: '0.3s ease-out 0.1s' },
  outter: { transition: '0.3s ease-out 0.1s' },
})

export default function GoalProgress({ size = 16, value, ...rest }) {
  const completed = value >= 1
  const c = useStyles({ completed })
  const theme = useTheme()
  const colorSuccess = theme.palette.success.main
  const colorMain = theme.palette.text.secondary

  const r = 12
  const length = 2 * Math.PI * r
  return (
    <svg height={size} width={size} viewBox="0 0 64 64" {...rest}>
      <circle
        className={c.outter}
        r="30"
        cx="32"
        cy="32"
        stroke={completed ? colorSuccess : colorMain}
        strokeWidth={2}
        opacity={completed ? 0.15 : 1}
        fill={completed ? colorSuccess : 'transparent'}
      />

      <g transform="">
        <circle
          className={c.inner}
          r={r}
          cx="32"
          cy="32"
          opacity="1"
          fill="transparent"
          stroke={completed ? colorSuccess : colorMain}
          strokeWidth={completed ? 0 : r * 2}
          strokeDasharray={`${value * length} ${length}`}
          transform={`rotate(${completed ? 0 : -90}, 32, 32)`}
        />
      </g>

      <path
        className={c.check}
        d="M16.5 30L28 41.5L47.5 22"
        strokeWidth="6"
        strokeDasharray={completed ? '60 60' : '0 60'}
        stroke={colorSuccess}
        fill="none"
      />
    </svg>
  )
}
