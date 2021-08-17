import React from 'react'
import { withStyles } from '@material-ui/styles'
import { Tooltip as MaterialTooltip, TooltipProps } from '@material-ui/core'

const StyledTooltip = withStyles(theme => ({
  tooltip: { fontSize: theme.typography.fontSize },
}))(MaterialTooltip)

export const Tooltip = (props: TooltipProps) => (
  <StyledTooltip enterDelay={300} {...props} />
)
