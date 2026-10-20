import { useTranslation } from 'react-i18next'
import type { TISOMonth } from '@/6-shared/types'
import { useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'

const labelKeys = {
  coverOverspending: 'coverOverspend',
  releaseSurplus: 'dropLeftover',
  goalAmount: 'goal',
  averageSpending: 'avgOutcome',
  previousAssignment: 'prevBudget',
  previousSpending: 'prevOutcome',
  childrenAssigned: 'sumOfChildren',
} as const satisfies Record<core.budgets.TBudgetPresetKind, string>

export function useQuickActions(
  month: TISOMonth,
  id: core.envelopes.TEnvelopeId
) {
  const { t } = useTranslation('quickBudgets')
  const presets = useAppSelector(state =>
    core.budgets.selectPresets(state, month, id)
  )
  return presets.map(preset => {
    const key =
      preset.kind === 'averageSpending'
        ? preset.months === 12
          ? 'avgOutcome_year'
          : preset.months === 6
            ? 'avgOutcome_halfYear'
            : 'avgOutcome'
        : labelKeys[preset.kind]
    return { ...preset, text: t(key, { count: preset.months }) }
  })
}
