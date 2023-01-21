import React from 'react'
import {
  Popover,
  PopoverProps,
  SwipeableDrawer,
  Theme,
  useMediaQuery,
} from '@mui/material'

export const AdaptivePopover = (props: PopoverProps) => {
  const isMobile = useMediaQuery<Theme>(theme => theme.breakpoints.down('md'))
  const { transitionDuration, anchorEl, ...rest } = props

  if (isMobile) {
    return (
      <SwipeableDrawer
        anchor="bottom"
        onOpen={() => {}}
        disableSwipeToOpen
        PaperProps={{
          sx: {
            maxHeight: 'calc(100vh - 48px)',
            borderRadius: '8px 8px 0 0',
          },
        }}
        {...rest}
        onClose={e => {
          if (rest.onClose) rest.onClose({}, 'backdropClick')
        }}
      />
    )
  }

  return <Popover anchorEl={anchorEl} {...props} />
}
