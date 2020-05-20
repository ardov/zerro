import { withStyles } from '@material-ui/core/styles'
import { Tooltip as MaterialTooltip } from '@material-ui/core'

export const Tooltip = withStyles(theme => ({
  tooltip: { fontSize: theme.typography.fontSize },
}))(MaterialTooltip)
