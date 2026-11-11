import { useTranslation } from 'react-i18next'
import { IconButton } from '@/6-shared/ui/kit/Button'
import { BarChartIcon } from '@/6-shared/ui/Icons'

export type SummaryToggle = {
  /** The summary of this list is on screen now. */
  shown: boolean
  onToggle: () => void
}

/** Opens what the list adds up to, beside or over the list. */
export function SummaryButton({ shown, onToggle }: SummaryToggle) {
  const { t } = useTranslation('transactionSummary')
  return (
    <IconButton
      label={t('title')}
      variant="ghost"
      size="sm"
      aria-pressed={shown}
      className="aria-pressed:bg-ui-pressed aria-pressed:text-ui-primary"
      onClick={onToggle}
    >
      <BarChartIcon />
    </IconButton>
  )
}
