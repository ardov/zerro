import type { FC } from 'react'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { FieldAddon, FieldSurface } from '@/6-shared/ui/kit/Field'
import { EmojiFlagsIcon } from '@/6-shared/ui/Icons'
import { cn } from '@/6-shared/ui/shadcn/utils'
import type { TFxCode } from '@/6-shared/types'
import { useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'
import { useMonth } from '../MonthProvider'
import { useGoalPopover } from '../GoalPopover'

/** The goal, drawn as a field beside the comment: same surface, hover and
 * first-line icon. The whole field is one button that opens the goal editor. */
export const GoalWidget: FC<{
  id: core.envelopes.TEnvelopeId
  currency: TFxCode
}> = ({ id, currency }) => {
  const { t } = useTranslation('budgets')
  const [month] = useMonth()
  const openGoalPopover = useGoalPopover()
  const goalInfo = useAppSelector(core.goals.selectAll)[month][id]
  const surfaceRef = useRef<HTMLDivElement>(null)
  const goal = goalInfo ? core.goals.formatGoal(goalInfo.goal, currency) : null

  return (
    <FieldSurface
      ref={surfaceRef}
      addonAlign="first-line"
      start={
        <FieldAddon kind="icon">
          <EmojiFlagsIcon />
        </FieldAddon>
      }
    >
      <button
        type="button"
        aria-label={goal ? t('goalValue', { goal }) : t('goal')}
        onClick={() => openGoalPopover(id, surfaceRef.current ?? undefined)}
        className={cn(
          'min-w-0 flex-1 cursor-default py-3 text-left wrap-anywhere outline-none',
          // The whole field opens the editor, so the button reaches over it.
          'before:absolute before:inset-0 before:rounded-[inherit]',
          !goal && 'text-ui-placeholder'
        )}
      >
        {goal ?? t('goal')}
      </button>
    </FieldSurface>
  )
}
