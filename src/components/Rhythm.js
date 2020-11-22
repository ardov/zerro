import React from 'react'
import { Box, makeStyles } from '@material-ui/core'

const useStyles = makeStyles(theme => ({
  y: {
    display: 'flex',
    flexDirection: 'column',
    '& > * + *': { marginTop: ({ gap }) => theme.spacing(gap) },
  },
  x: {
    display: 'flex',
    flexDirection: 'row',
    '& > * + *': { marginLeft: ({ gap }) => theme.spacing(gap) },
  },
}))

export default function Rhythm({ gap = 0, axis = 'y', children, ...rest }) {
  const classes = useStyles({ gap })
  if (!rest) console.log(123)
  return (
    <Box className={classes[axis]} {...rest}>
      {children}
    </Box>
  )
}
