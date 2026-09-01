import type { TBreakpointDown } from '@/6-shared/ui/theme/breakpoints'
import { mediaQueryDown } from '@/6-shared/ui/theme/breakpoints'
import { useMediaQueryValue } from './useMediaQueryValue'

/** True below the given application breakpoint. */
export function useBreakpointDown(key: TBreakpointDown) {
  return useMediaQueryValue(mediaQueryDown(key))
}
