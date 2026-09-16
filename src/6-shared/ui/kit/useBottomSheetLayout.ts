import { useMediaQueryValue } from '@/6-shared/hooks/useMediaQueryValue'

/** Bottom sheets are for narrow viewports, independently of the app layout. */
export function useBottomSheetLayout() {
  return useMediaQueryValue('(width < 500px)')
}
