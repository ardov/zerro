import { useMediaQueryValue } from '@/6-shared/hooks/useMediaQueryValue'

export function useBottomSheetLayout() {
  return useMediaQueryValue('(width < 500px)')
}
