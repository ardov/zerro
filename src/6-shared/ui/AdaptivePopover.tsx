import React from 'react'
import {
  Popover,
  PopoverProps,
  SwipeableDrawer,
  SwipeableDrawerProps,
  Theme,
  useMediaQuery,
} from '@mui/material'

const radius = '16px'
const br = {
  top: [0, 0, radius, radius].join(' '),
  left: [radius, 0, 0, radius].join(' '),
  right: [0, radius, radius, 0].join(' '),
  bottom: [radius, radius, 0, 0].join(' '),
}

export const AdaptivePopover = (
  props: PopoverProps & { anchor?: SwipeableDrawerProps['anchor'] }
) => {
  const isMobile = useMediaQuery<Theme>(theme => theme.breakpoints.down('md'))
  const { transitionDuration, anchorEl, anchor, ...rest } = props

  if (isMobile) {
    const placement = anchor || 'bottom'
    return (
      <SwipeableDrawer
        anchor={placement}
        onOpen={() => {}}
        disableSwipeToOpen
        {...rest}
        onClose={e => {
          if (rest.onClose) rest.onClose({}, 'backdropClick')
        }}
        slotProps={{
          paper: {
            sx: {
              maxHeight: 'calc(100vh - 48px)',
              borderRadius: br[placement],
            },
          },
        }}
      />
    )
  }

  return <Popover anchorEl={anchorEl} {...props} />
}
