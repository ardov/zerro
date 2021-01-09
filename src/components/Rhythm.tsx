import React from 'react'
import { Box, BoxProps, makeStyles } from '@material-ui/core'

interface StylesProps {
  gap: number
}

const useStyles = makeStyles(theme => ({
  y: {
    display: 'flex',
    flexDirection: 'column',
    '& > * + *': { marginTop: ({ gap }: StylesProps) => theme.spacing(gap) },
  },
  x: {
    display: 'flex',
    flexDirection: 'row',
    '& > * + *': { marginLeft: ({ gap }: StylesProps) => theme.spacing(gap) },
  },
}))

type RhythmProps = BoxProps & {
  gap?: number
  axis?: 'y' | 'x'
}

export default function Rhythm({
  gap = 0,
  axis = 'y',
  children,
  ...rest
}: RhythmProps) {
  const classes = useStyles({ gap })
  return (
    <Box className={classes[axis]} {...rest}>
      {children}
    </Box>
  )
}
