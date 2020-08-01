import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import { Tooltip as MaterialTooltip } from '@material-ui/core'

const StyledTooltip = withStyles(theme => ({
  tooltip: { fontSize: theme.typography.fontSize },
}))(MaterialTooltip)

export const Tooltip = props => <StyledTooltip enterDelay={300} {...props} />
