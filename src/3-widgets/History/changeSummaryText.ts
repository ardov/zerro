import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { entityLabelKeys } from '@/6-shared/localization/entityLabels'
import type { TChangeSummary } from '@/zerro-core/replica'

export function useChangeSummaryText() {
  // Entity names are defined by the backup dialog and live in `settings`.
  const { t } = useTranslation('settings')

  return useCallback(
    (summary: TChangeSummary | undefined): string => {
      if (!summary) return ''
      return entityLabelKeys
        .map(([key, labelKey]) => {
          const counts = summary[key]
          if (!counts) return ''
          const label = t(labelKey)
          if (!counts.removed) return `${label} ${counts.changed}`
          if (!counts.changed) return `${label} −${counts.removed}`
          return `${label} ${counts.changed} (−${counts.removed})`
        })
        .filter(Boolean)
        .join(' · ')
    },
    [t]
  )
}
