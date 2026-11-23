import type { TBreakpointDown } from '@/6-shared/ui/theme/breakpoints'
import { mediaQueryDown } from '@/6-shared/ui/theme/breakpoints'
import { useMediaQueryValue } from './useMediaQueryValue'

export function useBreakpointDown(key: TBreakpointDown) {
  return useMediaQueryValue(mediaQueryDown(key))
}
