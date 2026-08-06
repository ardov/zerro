import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Stack, Typography } from '@mui/material'
import { byLabelKey, entityLabelKeys } from '6-shared/localization/entityLabels'
import { useAppSelector } from 'store'
import { selectHistoryPointData } from 'store/history'
import { core } from 'zerro-core/redux'

/**
 * What restoring the selected point would write over the live state.
 *
 * The row's own diff says what the point changed when it happened; this says
 * what it would cost now, which is the question the restore button actually
 * asks. Computed only while a point is selected, because it is a full
 * store-to-store reconciliation rather than a stored transition.
 */
export function HistoryRestorePreview() {
  const { t } = useTranslation('settings')
  const { t: tHistory } = useTranslation('history')
  const current = useAppSelector(state => state.data.current)
  const point = useAppSelector(selectHistoryPointData)

  const summary = useMemo(
    () => (point ? core.restore.summarize(current, point) : undefined),
    [current, point]
  )

  if (!summary) return null

  const counted = byLabelKey(summary)
  const rows = entityLabelKeys.flatMap(([key, labelKey]) => {
    const counts = counted[key]
    if (!counts) return []
    const parts = [
      counts.created && t('importCreated', { n: counts.created }),
      counts.updated && t('importUpdated', { n: counts.updated }),
      counts.removed && t('importRemoved', { n: counts.removed }),
    ].filter(Boolean)
    return [{ key, label: t(labelKey), parts: parts.join(' · ') }]
  })

  return (
    <Box
      sx={{
        px: 2,
        py: 1.5,
        bgcolor: 'action.hover',
        // Its own scroll: with every type present this would otherwise push
        // the list it belongs to off the panel.
        maxHeight: '40%',
        overflowY: 'auto',
        flexShrink: 0,
      }}
    >
      <Typography variant="overline" color="text.secondary">
        {tHistory('restoreWouldChange')}
      </Typography>
      {rows.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {tHistory('restoreNoChanges')}
        </Typography>
      ) : (
        <Stack spacing={0.25} sx={{ mt: 0.5 }}>
          {rows.map(row => (
            <Box
              key={row.key}
              sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}
            >
              <Typography variant="body2" noWrap>
                {row.label}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                noWrap
                sx={{ flexShrink: 0 }}
              >
                {row.parts}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  )
}
