import { useAppDispatch } from '@/store'
import { track } from '@/6-shared/analytics'
import { useColorScheme } from '@/6-shared/ui/theme'
import { reloadData } from '@/4-features/sync'

export function useReloadData() {
  const dispatch = useAppDispatch()
  return () => {
    track('local_data_reload_requested', {})
    void dispatch(reloadData())
  }
}

export function useSettingsTheme() {
  const theme = useColorScheme()
  return {
    dark: theme.mode === 'dark',
    toggle: () => {
      theme.toggle()
      track('setting_changed', { setting: 'theme', value: 'changed' })
    },
  }
}
