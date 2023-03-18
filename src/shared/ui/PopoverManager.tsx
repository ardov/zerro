import React, { FC, ReactNode, useContext, useMemo, useState } from 'react'
import { popoverStack } from '@shared/hooks/usePopoverStack'
import { Modify } from '@shared/types'

type TKey = string
export type WithoutBaseProps<T> = Omit<T, 'open' | 'onClose'>
type WithBaseProps<T> = Modify<T, TBaseProps>
type TBaseProps = { open: boolean; onClose: () => void }

export function makePopoverHooks<
  ExtraProps extends object = {},
  DisplayProps extends object = TBaseProps
>(
  key: TKey,
  defaultExtraProps: ExtraProps,
  defaultDisplayProps?: WithoutBaseProps<DisplayProps>
) {
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
    const [isOpened] = popoverStack.useState(key)
    const methods = useMethods()
    const props = useContext(PopoverPropsContext)[key] as TStored
    const display = props?.display || defaultDisplayProps
    const extra = props?.extra || defaultExtraProps

    return useMemo(() => {
      const displayProps = {
        ...display,
        open: isOpened,
        onClose: methods.close,
      } as WithBaseProps<DisplayProps>

      return {
        key,
        displayProps,
        extraProps: extra,
        ...methods,
      }
    }, [display, extra, isOpened, methods])
  }

  return { useMethods, useProps, key }
}

const PopoverMethodsContext = React.createContext<{
  close: (key: TKey) => void
  open: (key: TKey, props?: object) => void
}>({ close: () => {}, open: () => {} })

const PopoverPropsContext = React.createContext<
  Record<TKey, object | undefined>
>({})

export const PopoverManager: FC<{ children: ReactNode }> = props => {
  const stackActions = popoverStack.useActions()
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
        {props.children}
      </PopoverPropsContext.Provider>
    </PopoverMethodsContext.Provider>
  )
}
