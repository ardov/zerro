import { useEffect, useRef } from 'react'
import { isThisYear } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { appRelease, appVersion, buildDate } from '@/6-shared/config'
import { formatDate } from '@/6-shared/helpers/date'
import { ButtonBase } from '@/6-shared/ui/kit/ButtonBase'
import { toast } from '@/6-shared/ui/kit/Toast'
import { checkAppUpdates } from '@/4-features/appUpdates'

/** Press to check for updates; hold to show and copy the build for a bug report. */
export function SettingsVersion() {
  const { t } = useTranslation('settings')
  const date = new Date(buildDate)
  const label = t('version', {
    version: appVersion,
    date: formatDate(date, isThisYear(date) ? 'dd.MM' : 'dd.MM.yyyy'),
  })
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const held = useRef(false)
  const cancel = () => clearTimeout(timer.current)
  useEffect(() => () => clearTimeout(timer.current), [])
  return (
    <ButtonBase
      aria-label={t('checkUpdates')}
      className="min-w-0 py-2 text-ui-14 text-ui-tertiary select-none [-webkit-touch-callout:none]"
      onPointerDown={() => {
        cancel()
        held.current = false
        timer.current = setTimeout(() => {
          held.current = true
          toast.add({ type: 'info', title: t('build', { build: appRelease }) })
          navigator.clipboard?.writeText(appRelease).catch(() => {})
        }, 600)
      }}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onContextMenu={event => event.preventDefault()}
      onClick={() => {
        if (!held.current) void checkAppUpdates()
        held.current = false
      }}
    >
      <span className="truncate">{label}</span>
    </ButtonBase>
  )
}
