import { useBreakpointDown } from '@/6-shared/hooks/useBreakpointDown'

/** Shared mobile mode for the shell, page layout and navigation. */
export const useMobileLayout = () => useBreakpointDown('sm')
