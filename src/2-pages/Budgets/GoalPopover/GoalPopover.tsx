import { Button, IconButton } from '@/6-shared/ui/kit/Button'
import type { FC } from 'react'
import { useState } from 'react'
import { PopoverSurface } from '@/6-shared/ui/kit/Popover'
import { Select } from '@/6-shared/ui/kit/Select'
import { useTranslation } from 'react-i18next'
import { AmountInput } from '@/6-shared/ui/kit/AmountInput'
import { CloseIcon } from '@/6-shared/ui/Icons'
import MonthSelectPopover from '@/6-shared/ui/MonthSelectPopover'
import { toISODate, formatDate } from '@/6-shared/helpers/date'
import { track } from '@/6-shared/analytics'
import type { TDateDraft, TISOMonth } from '@/6-shared/types'

import { useAppDispatch, useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'
import { usePopup } from '@/6-shared/overlays'

export type TGoalPopoverProps = {
  open: boolean
  anchorEl?: Element | null
  onClose: () => void
  id: core.envelopes.TEnvelopeId
  month: TISOMonth
}

export const GoalPopover: FC<TGoalPopoverProps> = props => {
  const { id, month, onClose, open, anchorEl } = props
  const { t } = useTranslation('goals')
  const dispatch = useAppDispatch()
  const envelope = useAppSelector(core.envelopes.selectAll)[id]
  const goalInfo = useAppSelector(core.goals.selectAll)[month][id] || {}
  const { goal } = goalInfo

  const [type, setType] = useState(
    goal?.type || core.goals.goalType.MONTHLY_SPEND
  )
  const isInPercents = type === core.goals.goalType.INCOME_PERCENT
  const [rawValue, setRawValue] = useState(getInput(goal?.amount))
  const [endDate, setEndDate] = useState<core.goals.TGoal['end']>(goal?.end)

  // On the overlay stack, so Back closes the month list rather than the goal
  // popover underneath it.
  const { open: monthOpen, setOpen: setMonthOpen } = usePopup()
  const [monthPopoverAnchor, setMonthPopoverAnchor] =
    useState<HTMLButtonElement | null>(null)
  if (!id || !month) return null

  const closeMonthPopover = () => setMonthOpen(false)
  const handleDateChange = (date?: TDateDraft) => {
    closeMonthPopover()
    setEndDate(date ? toISODate(date) : undefined)
  }
  const removeDate = () => handleDateChange(undefined)

  const save = (value = rawValue) => {
    const amount = getAmount(value)
    const hasChanges =
      amount !== goal?.amount || type !== goal?.type || endDate !== goal?.end

    if (hasChanges) {
      const goal: core.goals.TGoal = { type, amount }
      if (type === core.goals.goalType.TARGET_BALANCE && endDate) {
        goal.end = endDate
      }
      dispatch(core.goals.set(month, id, goal))
      track('budget_goal_changed', {
        operation: 'set',
        goal_type: goal.type,
      })
    }
    onClose?.()
  }
  const removeGoal = () => {
    dispatch(core.goals.set(month, id, null))
    track('budget_goal_changed', { operation: 'delete' })
    onClose?.()
  }

  const showDateBlock = type === core.goals.goalType.TARGET_BALANCE

  const amountLabels = {
    [core.goals.goalType.MONTHLY]: t('inputLabels.monthly'),
    [core.goals.goalType.MONTHLY_SPEND]: t('inputLabels.monthlySpend'),
    [core.goals.goalType.TARGET_BALANCE]: t('inputLabels.targetBalance'),
    [core.goals.goalType.INCOME_PERCENT]: t('inputLabels.incomePercent'),
  }

  return (
    <PopoverSurface
      label={t('goal', { ns: 'budgets' })}
      controller={{
        open,
        setOpen: next => {
          if (!next) onClose()
        },
      }}
      anchor={anchorEl}
    >
      <div className="grid gap-4">
        <Select
          label={t('goalType')}
          labelMode="floating"
          value={type}
          onChange={setType}
          required
          items={[
            { value: core.goals.goalType.MONTHLY, label: t('names.monthly') },
            {
              value: core.goals.goalType.MONTHLY_SPEND,
              label: t('names.monthlySpend'),
            },
            {
              value: core.goals.goalType.TARGET_BALANCE,
              label: t('names.targetBalance'),
            },
            {
              value: core.goals.goalType.INCOME_PERCENT,
              label: t('names.incomePercent'),
            },
          ]}
        />

        <AmountInput
          autoFocus
          selectOnFocus
          value={rawValue}
          label={amountLabels[type]}
          prefix={isInPercents ? undefined : envelope.currency}
          suffix={isInPercents ? '%' : undefined}
          labelMode="floating"
          onChange={value => setRawValue(+value)}
          onEnter={save}
          placeholder="0"
        />

        {showDateBlock && (
          <div className="flex">
            <Button
              ref={setMonthPopoverAnchor}
              variant="secondary"
              // The calendar hangs off this button, not off whatever opened
              // the goal: it is a nested surface, and it lands over its own
              // control rather than over the form it belongs to.
              onClick={() => setMonthOpen(true)}
              className="min-w-0 flex-1"
            >
              {endDate
                ? formatDate(endDate, 'LLLL yyyy').toUpperCase()
                : t('tillDate')}
            </Button>
            {endDate && (
              <IconButton
                tooltip={false}
                variant="ghost"
                label={t('removeValue', {
                  ns: 'common',
                  label: formatDate(endDate, 'LLLL yyyy'),
                })}
                onClick={removeDate}
              >
                <CloseIcon />
              </IconButton>
            )}
          </div>
        )}

        <Button onClick={() => save()}>{t('save')}</Button>
        {!!goal?.amount && (
          <Button onClick={removeGoal} variant="destructive">
            {t('remove')}
          </Button>
        )}
      </div>
      <MonthSelectPopover
        open={monthOpen}
        anchorEl={monthPopoverAnchor}
        onClose={closeMonthPopover}
        onChange={handleDateChange}
        value={endDate}
        disablePast
      />
    </PopoverSurface>
  )

  function getAmount(input: string | number) {
    if (!+input) return 0
    return isInPercents ? +input / 100 : +input
  }

  function getInput(goalAmount: undefined | number) {
    if (!goalAmount) return 0
    return isInPercents ? +goalAmount * 100 : +goalAmount
  }
}
