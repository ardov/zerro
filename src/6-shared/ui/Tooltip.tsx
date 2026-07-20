import type { FC } from 'react'
import type { TooltipProps } from '@mui/material'
import {
  styled,
  Tooltip as MaterialTooltip,
  tooltipClasses,
} from '@mui/material'
import type { Modify } from '6-shared/types'

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
