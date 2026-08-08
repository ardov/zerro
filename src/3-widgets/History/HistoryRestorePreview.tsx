import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Button, Stack, Typography } from '@mui/material'
import { byLabelKey, entityLabelKeys } from '6-shared/localization/entityLabels'
import { useAppSelector } from 'store'
import {
  selectHistoryPointData,
  selectSelectedHistoryEntryMissing,
  selectSelectedHistoryPoint,
} from 'store/history'
import { core } from 'zerro-core/redux'
import { useRestoreSelectedPoint } from './useRestoreSelectedPoint'

/**
 * What restoring the selected point would write over the live state, and the
 * button that does it.
 *
 * The row's own summary says what the point changed when it happened; this
 * says what it would cost now, which is the question the button actually asks.
 * The two live together because a count without the action it justifies is
 * just trivia. Computed only while a point is selected, because it is a full
 * store-to-store reconciliation rather than a stored transition.
 */
export function HistoryRestorePreview() {
  const { t } = useTranslation('settings')
  const { t: tHistory } = useTranslation('history')
  const current = useAppSelector(state => state.data.current)
  const point = useAppSelector(selectSelectedHistoryPoint)
  const data = useAppSelector(selectHistoryPointData)
  const missing = useAppSelector(selectSelectedHistoryEntryMissing)
  const { canRestore, restore } = useRestoreSelectedPoint()

  const summary = useMemo(
    () => (data ? core.restore.summarize(current, data) : undefined),
    [current, data]
  )

  // Nothing selected means the list is showing live state; there is no
  // "restore" question to answer and the panel should not reserve room for one.
  if (!point) return null

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
        borderTop: '1px solid',
        borderColor: 'divider',
        flexShrink: 0,
      }}
    >
      <Typography variant="overline" color="text.secondary">
        {tHistory('restoreWouldChange')}
      </Typography>
      {/* Its own scroll: with every entity type present the list would
          otherwise push the button it belongs to off the panel. */}
      <Box sx={{ maxHeight: 160, overflowY: 'auto' }}>
        {missing ? (
          <Typography variant="body2" color="text.secondary">
            {tHistory('pointUnavailable')}
          </Typography>
        ) : !summary ? (
          <Typography variant="body2" color="text.secondary">
            {tHistory('restoreLoading')}
          </Typography>
        ) : rows.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {tHistory('restoreNoChanges')}
          </Typography>
        ) : (
          <Stack spacing={0.25} sx={{ mt: 0.5 }}>
            {rows.map(row => (
              <Box
                key={row.key}
                sx={{
                  display: 'flex',
                  gap: 2,
                  justifyContent: 'space-between',
                }}
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
      <Button
        fullWidth
        size="small"
        variant="contained"
        disabled={!canRestore}
        onClick={restore}
        sx={{ mt: 1.5 }}
      >
        {tHistory('restorePoint')}
      </Button>
    </Box>
  )
}
