import React from 'react'
import {
  Dialog,
  DialogProps,
  SwipeableDrawer,
  Theme,
  useMediaQuery,
} from '@mui/material'
import { makePopoverHooks } from '@shared/historyPopovers'

function makeSmartDialog(
  key: string,
  defaultExtraProps: object,
  defaultBaseProps?: object
) {
  const hooks = makePopoverHooks(key, defaultExtraProps, defaultBaseProps)

  function SmartDialog(props: Omit<DialogProps, 'open'>) {
    const state = hooks.useProps()
    const isMobile = useMediaQuery<Theme>(theme => theme.breakpoints.down('sm'))

    if (!isMobile) return <Dialog {...props} {...state.displayProps} />

    return (
      <SwipeableDrawer
        {...props}
        {...state.displayProps}
        anchor="bottom"
        onOpen={state.open}
        disableSwipeToOpen
        PaperProps={drawerPaperProps}
      />
    )
  }

  return {
    Wrapper: SmartDialog,
    useMethods: hooks.useMethods,
    useProps: hooks.useProps,
  }
}

const drawerPaperProps = {
  sx: { maxHeight: 'calc(100vh - 48px)', borderRadius: '8px 8px 0 0' },
}
