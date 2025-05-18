import React from 'react'
import {
  FormControl,
  InputLabel,
  MenuList,
  Select,
  SelectProps,
} from '@mui/material'
import { popoverStack } from '6-shared/historyPopovers'

import { SwipeableDrawer, Theme, useMediaQuery } from '@mui/material'

type TSmartSelectProps<T = unknown> = SelectProps<T> & { elKey: string }

export function SmartSelect<T>(props: TSmartSelectProps<T>) {
  const { elKey, ...selectProps } = props
  const [open, onOpen, onClose] = popoverStack.usePopoverState(elKey)
  const isMobile = useMediaQuery<Theme>(theme => theme.breakpoints.down('sm'))

  const labelId = props.label
    ? `${props.id || 'smart-select'}-label`
    : undefined

  return (
    <FormControl>
      {props.label && <InputLabel id={labelId}>{props.label}</InputLabel>}
      <Select
        {...selectProps}
        labelId={labelId}
        open={isMobile ? false : open}
        onOpen={onOpen}
        onClose={onClose}
      />
      {isMobile && (
        <SwipeableDrawer
          disablePortal
          anchor="bottom"
          onOpen={() => {}}
          disableSwipeToOpen
          open={open}
          onClose={onClose}
          keepMounted={false}
          ModalProps={{ keepMounted: false }}
          slotProps={{
            paper: {
              sx: {
                maxHeight: 'calc(100vh - 48px)',
                borderRadius: '8px 8px 0 0',
              },
            },
          }}
        >
          <MenuList autoFocus>
            {React.Children.toArray(selectProps.children).map(child => {
              // @ts-expect-error
              const value = child.props.value
              const selected = value === selectProps.value
              // @ts-expect-error
              return React.cloneElement(child, {
                // @ts-expect-error
                onClick: event => {
                  onClose()

                  if (selectProps.onChange) {
                    // Redefine target to allow name and value to be read.
                    // This allows seamless integration with the most popular form libraries.
                    // https://github.com/mui/material-ui/issues/13485#issuecomment-676048492
                    // Clone the event to not override `target` of the original event.
                    const nativeEvent = event.nativeEvent || event
                    const clonedEvent = new nativeEvent.constructor(
                      nativeEvent.type,
                      nativeEvent
                    )

                    Object.defineProperty(clonedEvent, 'target', {
                      writable: true,
                      value: { value, name: selectProps.name },
                    })
                    // @ts-expect-error
                    selectProps.onChange(clonedEvent)
                  }
                },
                selected,
                value: undefined,
              })
            })}
          </MenuList>
        </SwipeableDrawer>
      )}
    </FormControl>
  )
}
