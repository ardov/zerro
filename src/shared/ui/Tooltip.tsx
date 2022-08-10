import React, { FC } from 'react'
import { withStyles } from '@mui/styles'
import { Tooltip as MaterialTooltip, TooltipProps } from '@mui/material'
import { Modify } from 'shared/types'

const StyledTooltip = withStyles(theme => ({
  tooltip: { fontSize: theme.typography.fontSize },
}))(MaterialTooltip)

type CustomTooltipProps = Modify<
  TooltipProps,
  {
    title?: TooltipProps['title']
  }
>

export const Tooltip: FC<CustomTooltipProps> = ({ title, ...props }) => {
  if (!title) {
    return <>{props.children}</>
  }
  return <StyledTooltip enterDelay={300} title={title} {...props} />
}
