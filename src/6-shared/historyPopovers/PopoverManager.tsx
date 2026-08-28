import type { TKey } from './popoverStack'
import type { FC, ReactNode } from 'react'
import React, { useContext, useMemo, useState } from 'react'
import { popoverStack } from './popoverStack'
import type { Modify } from '6-shared/types'

/** Context for methods to open/close popovers */
const PopoverMethodsContext = React.createContext<{
  close: (key: TKey) => void
  open: (key: TKey, props?: object) => void
  openReplacing: (key: TKey, props?: object) => void
}>({ close: () => {}, open: () => {}, openReplacing: () => {} })

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

  const storeProps = (key: TKey, props?: object) =>
    setPopProps(s => {
      if (s[key] === props) return s
      return { ...s, [key]: { ...s[key], ...props } }
    })

  const methods = useMemo(
    () => ({
      close: stackActions.close,
      open: (key: TKey, props?: object) => {
        storeProps(key, props)
        stackActions.open(key)
      },
      openReplacing: (key: TKey, props?: object) => {
        storeProps(key, props)
        stackActions.openReplacing(key)
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

/** Bumped on every open so each one yields a fresh `instanceKey`.
 *
 * A timestamp would collide when two opens land in the same millisecond, and
 * the value is only ever compared against the previous one. */
let openCounter = 0

export function registerPopover<
  ExtraProps extends object = object,
  DisplayProps extends object = TBaseProps,
>(
  key: TKey,
  defaultExtraProps: ExtraProps,
  defaultDisplayProps?: WithoutBaseProps<DisplayProps>
) {
  // Prevent duplicate registration. Under HMR a module re-executes and calls
  // this again with the same key — that's expected in dev, so only treat a
  // duplicate as a fatal error in a production build (where each module loads
  // once and a real duplicate is a genuine bug).
  if (registeredPopovers[key] && import.meta.env.PROD)
    throw new Error(`Popover "${key}" already registered`)
  registeredPopovers[key] = true

  type TStored =
    | {
        extra: ExtraProps
        display?: WithoutBaseProps<DisplayProps>
        instanceKey: number
      }
    | undefined

  function useMethods() {
    const { open, openReplacing, close } = useContext(PopoverMethodsContext)
    return useMemo(() => {
      return {
        open: (extra: ExtraProps, display?: WithoutBaseProps<DisplayProps>) =>
          open(key, { extra, display, instanceKey: ++openCounter } as TStored),
        /** Opens this popover in place of whatever is currently open. */
        openReplacing: (
          extra: ExtraProps,
          display?: WithoutBaseProps<DisplayProps>
        ) =>
          openReplacing(key, {
            extra,
            display,
            instanceKey: ++openCounter,
          } as TStored),
        close: () => close(key),
      }
    }, [open, openReplacing, close])
  }

  function useProps() {
    const methods = useMethods()
    const stack = useContext(PopoverStackContext)
    const isOpened = stack.includes(key)
    const props = useContext(PopoverPropsContext)[key] as TStored
    const display = props?.display || defaultDisplayProps
    const extraProps = props?.extra || defaultExtraProps
    const instanceKey = props?.instanceKey ?? 0

    return useMemo(() => {
      const displayProps = {
        ...display,
        open: isOpened,
        onClose: methods.close,
      } as WithBaseProps<DisplayProps>

      // `instanceKey` is deliberately not part of `displayProps`: it is a
      // React key, and React 19 warns when one arrives through a spread. Use
      // it as `<Popover key={instanceKey} />` when a popover must start from
      // a fresh draft on every opening.
      return { key, instanceKey, displayProps, extraProps, ...methods }
    }, [display, extraProps, instanceKey, isOpened, methods])
  }

  return { useMethods, useProps, key }
}
