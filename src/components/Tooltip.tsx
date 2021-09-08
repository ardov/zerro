import React from 'react'
import { withStyles } from '@mui/styles'
import { Tooltip as MaterialTooltip, TooltipProps } from '@mui/material'

const StyledTooltip = withStyles(theme => ({
  tooltip: { fontSize: theme.typography.fontSize },
}))(MaterialTooltip)

export const Tooltip = (props: TooltipProps) => (
  <StyledTooltip enterDelay={300} {...props} />
)
