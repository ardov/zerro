import React, { FC } from 'react'
import {
  styled,
  Tooltip as MaterialTooltip,
  tooltipClasses,
  TooltipProps,
} from '@mui/material'
import { Modify } from '@shared/types'

const StyledTooltip = styled(({ className, ...props }: TooltipProps) => (
  <MaterialTooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    fontSize: theme.typography.fontSize,
  },
}))

type CustomTooltipProps = Modify<
  TooltipProps,
  { title?: TooltipProps['title'] }
>

export const Tooltip: FC<CustomTooltipProps> = ({ title, ...props }) => {
  if (!title) return <>{props.children}</>
  return <StyledTooltip enterDelay={300} title={title} {...props} />
}
