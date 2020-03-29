import React from 'react'
import { Box, useTheme } from '@material-ui/core'

const directions = {
  x: 'column',
  y: 'row',
}

export default function Rhythm({ gap = 0, axis = 'y', children, ...rest }) {
  const theme = useTheme()
  const spacing = theme.spacing(gap)
  const makeStyles = (spacing, axis) => {
    const style = { display: 'grid' }
    if (axis === 'y' && spacing) style.gridRowGap = spacing
    if (axis === 'x' && spacing) style.gridColumnGap = spacing
    style.gridAutoFlow = directions[axis]
    return style
  }

  return (
    <Box style={makeStyles(spacing, axis)} {...rest}>
      {children}
    </Box>
  )
}
