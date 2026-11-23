//  Source https://usehooks.com/useToggle/
import { useCallback, useState } from 'react'

export const useToggle = (initialState: boolean = false) => {
  const [state, setState] = useState<boolean>(initialState)
  const toggle = useCallback((): void => setState(state => !state), [])
  return [state, toggle] as [boolean, typeof toggle]
}
