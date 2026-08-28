import type { TBreakpointDown } from '6-shared/ui/theme/breakpoints'
import { mediaQueryDown } from '6-shared/ui/theme/breakpoints'
import { useMediaQueryValue } from './useMediaQueryValue'

/** True below the given breakpoint, matching MUI's `breakpoints.down`. */
export function useBreakpointDown(key: TBreakpointDown) {
  return useMediaQueryValue(mediaQueryDown(key))
}
