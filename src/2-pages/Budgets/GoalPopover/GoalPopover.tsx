import { Button, IconButton } from '@/6-shared/ui/Button'
import type { FC } from 'react'
import { useState } from 'react'
import { Popover, type PopoverProps } from '@/6-shared/ui/Popover'
import { Select } from '@/6-shared/ui/Select'
import { useTranslation } from 'react-i18next'
import { AmountInput } from '@/6-shared/ui/AmountInput'
import { CloseIcon } from '@/6-shared/ui/Icons'
import MonthSelectPopover from '@/6-shared/ui/MonthSelectPopover'
import { toISODate, formatDate } from '@/6-shared/helpers/date'
import { track } from '@/6-shared/analytics'
import type { Modify, TDateDraft, TISOMonth } from '@/6-shared/types'

import { useAppDispatch, useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'
import { usePopup } from '@/6-shared/overlays'

export type TGoalPopoverProps = Modify<
  PopoverProps,
  { onClose: () => void }
> & {
  id: core.envelopes.TEnvelopeId
  month: TISOMonth
}

export const GoalPopover: FC<TGoalPopoverProps> = props => {
  const { id, month, onClose, ...rest } = props
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
  const [monthOpen, setMonthOpen] = usePopup()
  const [monthPopoverAnchor, setMonthPopoverAnchor] =
    useState<(typeof props)['anchorEl']>(null)
  if (!id || !month) return null

  const closeMonthPopover = () => setMonthOpen(false)
  const handleDateChange = (date?: TDateDraft) => {
    closeMonthPopover()
    setEndDate(date ? toISODate(date) : undefined)
  }
  const removeDate = () => handleDateChange(undefined)

  const save = () => {
    const amount = getAmount(rawValue)
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
    <Popover
      aria-label={t('goal', { ns: 'budgets' })}
      onClose={onClose}
      {...rest}
    >
      <div className="grid min-w-80 gap-y-4 p-4">
        <Select
          label={t('goalType')}
          fullWidth
          value={type}
          onChange={setType}
          options={[
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
          onFocus={e => e.target.select()}
          selectOnFocus
          value={rawValue}
          label={amountLabels[type]}
          fullWidth
          onChange={value => setRawValue(+value)}
          onEnter={value => {
            setRawValue(+value)
            save()
          }}
          currency={isInPercents ? '%' : envelope.currency}
          placeholder="0"
        />

        {showDateBlock && (
          <div className="flex">
            <Button
              size="large"
              // The calendar hangs off this button, not off whatever opened
              // the goal: it is a nested surface, and it lands over its own
              // control rather than over the form it belongs to.
              onClick={event => {
                setMonthPopoverAnchor(event.currentTarget)
                setMonthOpen(true)
              }}
              fullWidth={!endDate}
            >
              {endDate
                ? formatDate(endDate, 'LLLL yyyy').toUpperCase()
                : t('tillDate')}
            </Button>
            {endDate && (
              <IconButton onClick={removeDate} children={<CloseIcon />} />
            )}
          </div>
        )}

        <Button onClick={save} variant="contained" color="primary">
          {t('save')}
        </Button>
        {!!goal?.amount && (
          <Button onClick={removeGoal} variant="outlined" color="error">
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
    </Popover>
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
