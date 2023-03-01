import { PopoverProps } from '@mui/material'
import { keys } from '@shared/helpers/keys'
import { usePopoverStack } from '@shared/hooks/usePopoverStack'
import { Modify } from '@shared/types'
import React, {
  FC,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

type TKey = string
type TBaseProps = { open: boolean; onClose?: () => void }
type WithBaseProps<T> = Modify<T, Required<TBaseProps>>
type WithoutBaseProps<T> = Omit<T, 'open' | 'onClose'>
export type TPopoverProps = Modify<PopoverProps, { onClose?: () => void }>
const defaultProps: TPopoverProps = { open: false, onClose: () => {} }

const PopoverMethodsContext = React.createContext<{
  close: (key: TKey) => void
  open: (key: TKey, props?: Partial<TPopoverProps>) => void
}>({ close: () => {}, open: () => {} })
const PopoverPropsContext = React.createContext<
  Record<TKey, TPopoverProps | undefined>
>({})

export function usePopoverProps<Props extends TBaseProps>(key: TKey) {
  const props = useContext(PopoverPropsContext)
  return (props[key] || defaultProps) as WithBaseProps<Props>
}

export function usePopoverMethods<Props extends TBaseProps>(key: TKey) {
  const { open, close } = useContext(PopoverMethodsContext)
  const memoized = useMemo(
    () => ({
      openOnClick: (e: React.MouseEvent<Element, MouseEvent>) =>
        open(key, { anchorEl: e.currentTarget }),
      open: (props?: WithoutBaseProps<Props>) => open(key, props),
      close: () => close(key),
    }),
    [open, close, key]
  )
  return memoized
}

export function usePopover<Props extends TBaseProps>(key: TKey) {
  const methods = usePopoverMethods<Props>(key)
  const props = usePopoverProps<Props>(key)
  return { ...methods, props }
}

export const PopoverManager: FC<{ children: ReactNode }> = props => {
  const [stack, pushKey, popKey] = usePopoverStack()
  const [popProps, setPopProps] = useState<
    Record<TKey, TPopoverProps | undefined>
  >({})

  useEffect(() => {
    setPopProps(state => {
      let changed = false
      let nextState = { ...state }

      keys(state).forEach(key => {
        const isOpen = stack.includes(key)
        if (state[key]!.open === isOpen) return
        changed = true
        nextState[key] = { ...nextState[key], open: isOpen }
      })

      stack.forEach(key => {
        if (key in nextState) return
        changed = true
        nextState[key] = { open: true, onClose: () => popKey(key) }
      })

      return changed ? nextState : state
    })
  }, [popKey, stack])

  const methods = useMemo(
    () => ({
      close: popKey,
      open: (key: TKey, props?: Partial<TPopoverProps>) => {
        setPopProps(s => {
          return {
            ...s,
            [key]: {
              ...s[key],
              ...props,
              open: true,
              onClose: () => popKey(key),
            },
          }
        })
        pushKey(key)
      },
    }),
    [popKey, pushKey]
  )

  return (
    <PopoverMethodsContext.Provider value={methods}>
      <PopoverPropsContext.Provider value={popProps}>
        {props.children}
      </PopoverPropsContext.Provider>
    </PopoverMethodsContext.Provider>
  )
}
