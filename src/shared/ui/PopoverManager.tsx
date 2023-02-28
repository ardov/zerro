import { PopoverProps } from '@mui/material'
import { keys } from '@shared/helpers/keys'
import { usePopoverStack } from '@shared/hooks/usePopoverStack'
import { Modify } from '@shared/types'
import React, {
  FC,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

type TKey = string
type TBaseProps = { open: boolean; onClose: () => void }

export type TPopoverProps = Modify<PopoverProps, { onClose?: () => void }>

const defaultProps: TPopoverProps = { open: false, onClose: () => {} }

const PopoverContext = React.createContext<{
  close: (key: TKey) => void
  open: (key: TKey, props?: Partial<TPopoverProps>) => void
  getProps: (key: TKey) => TPopoverProps
}>({
  close: () => {},
  open: () => {},
  getProps: () => defaultProps,
})

export function usePopover<Props extends TBaseProps>(key: TKey) {
  const { open, close, getProps } = useContext(PopoverContext)
  const openPopover = useCallback(
    (props?: Partial<Props>) => open(key, props),
    [key, open]
  )
  const openOnClick = useCallback(
    (e: React.MouseEvent<Element, MouseEvent>) =>
      open(key, { anchorEl: e.currentTarget }),
    [key, open]
  )
  const closePopover = useCallback(() => close(key), [key, close])
  const props = getProps(key) as Props

  return {
    openOnClick,
    open: openPopover,
    close: closePopover,
    props,
  }
}

export const PopoverManager: FC<{ children: ReactNode }> = props => {
  const [popProps, setPopProps] = useState<
    Record<TKey, TPopoverProps | undefined>
  >({})

  const [stack, pushKey, popKey] = usePopoverStack()

  const close = useCallback(popKey, [popKey])

  const open = useCallback(
    (key: TKey, props?: Partial<TPopoverProps>) => {
      setPopProps(s => {
        return {
          ...s,
          [key]: {
            ...s[key],
            ...props,
            open: true,
            onClose: () => close(key),
          },
        }
      })
      pushKey(key)
    },
    [close, pushKey]
  )

  const getProps = useCallback(
    (key: TKey): TPopoverProps => {
      if (popProps[key]) return popProps[key]!
      return defaultProps
    },
    [popProps]
  )

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
        nextState[key] = { open: true, onClose: () => close(key) }
      })

      return changed ? nextState : state
    })
  }, [close, stack])

  const methods = useMemo(
    () => ({
      close,
      open,
      getProps,
    }),
    [close, getProps, open]
  )

  return (
    <PopoverContext.Provider value={methods}>
      {props.children}
    </PopoverContext.Provider>
  )
}
