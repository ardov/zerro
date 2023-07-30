import type { TKey } from './popoverStack'
import React, { FC, ReactNode, useContext, useMemo, useState } from 'react'
import { popoverStack } from './popoverStack'
import { Modify } from '@shared/types'

/** Context for methods to open/close popovers */
const PopoverMethodsContext = React.createContext<{
  close: (key: TKey) => void
  open: (key: TKey, props?: object) => void
}>({ close: () => {}, open: () => {} })

/** Context for props of popovers */
const PopoverPropsContext = React.createContext<
  Record<TKey, object | undefined>
>({})

/** Context for stack of popovers */
const PopoverStackContext = React.createContext<TKey[]>([])

/** Main wrapper to use popovers */
export const PopoverManager: FC<{ children: ReactNode }> = props => {
  const stackActions = popoverStack.useActions()
  const stack = popoverStack.usePopoverStack()
  const [popProps, setPopProps] = useState<Record<TKey, any | undefined>>({})

  const methods = useMemo(
    () => ({
      close: stackActions.close,
      open: (key: TKey, props?: object) => {
        setPopProps(s => {
          if (s[key] === props) return s
          return { ...s, [key]: { ...s[key], ...props } }
        })
        stackActions.open(key)
      },
    }),
    [stackActions]
  )

  return (
    <PopoverMethodsContext.Provider value={methods}>
      <PopoverPropsContext.Provider value={popProps}>
        <PopoverStackContext.Provider value={stack}>
          {props.children}
        </PopoverStackContext.Provider>
      </PopoverPropsContext.Provider>
    </PopoverMethodsContext.Provider>
  )
}

// —————————————————————————————————————————————————————————————————————————
// Popover Hooks
// —————————————————————————————————————————————————————————————————————————

type WithoutBaseProps<T> = Omit<T, 'open' | 'onClose'>
type WithBaseProps<T> = Modify<T, TBaseProps>
type TBaseProps = { open: boolean; onClose: () => void }

const registeredPopovers = {} as Record<TKey, any>

export function registerPopover<
  ExtraProps extends object = {},
  DisplayProps extends object = TBaseProps
>(
  key: TKey,
  defaultExtraProps: ExtraProps,
  defaultDisplayProps?: WithoutBaseProps<DisplayProps>
) {
  // Prevent duplicate registration
  if (registeredPopovers[key])
    throw new Error(`Popover "${key}" already registered`)
  registeredPopovers[key] = true

  type TStored =
    | { extra: ExtraProps; display?: WithoutBaseProps<DisplayProps> }
    | undefined

  function useMethods() {
    const { open, close } = useContext(PopoverMethodsContext)
    return useMemo(() => {
      return {
        open: (extra: ExtraProps, display?: WithoutBaseProps<DisplayProps>) =>
          open(key, { extra, display } as TStored),
        close: () => close(key),
      }
    }, [open, close])
  }

  function useProps() {
    const methods = useMethods()
    const stack = useContext(PopoverStackContext)
    const isOpened = stack.includes(key)
    const props = useContext(PopoverPropsContext)[key] as TStored
    const display = props?.display || defaultDisplayProps
    const extraProps = props?.extra || defaultExtraProps

    return useMemo(() => {
      const displayProps = {
        ...display,
        open: isOpened,
        onClose: methods.close,
      } as WithBaseProps<DisplayProps>

      return { key, displayProps, extraProps, ...methods }
    }, [display, extraProps, isOpened, methods])
  }

  return { useMethods, useProps, key }
}
