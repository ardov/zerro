import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { entityLabelKeys } from '@/6-shared/localization/entityLabels'
import type { TChangeSummary } from '@/zerro-core/replica'

/**
 * Renders a change summary as one line for a list row: "Операции 3 · Счета 1".
 *
 * Counts only — a row says how much moved, and the panel is where the user
 * goes to see what. Removals carry a sign rather than a word, because the line
 * has to survive a 380px drawer without wrapping.
 */
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
