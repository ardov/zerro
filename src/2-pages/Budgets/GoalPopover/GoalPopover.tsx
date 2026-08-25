import type { FC } from 'react'
import { useState } from 'react'
import type { OutlinedTextFieldProps, PopoverProps } from '@mui/material'
import { Popover, TextField, MenuItem, Button, IconButton } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { AmountInput } from '6-shared/ui/AmountInput'
import { CloseIcon } from '6-shared/ui/Icons'
import MonthSelectPopover from '6-shared/ui/MonthSelectPopover'
import { toISODate, formatDate } from '6-shared/helpers/date'
import { track } from '6-shared/analytics'
import type { Modify, TDateDraft, TISOMonth } from '6-shared/types'

import { useAppDispatch, useAppSelector } from 'store'
import { core } from 'zerro-core/redux'

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

  const [monthPopoverAnchor, setMonthPopoverAnchor] =
    useState<(typeof props)['anchorEl']>(null)
  if (!id || !month) return null

  const handleTypeChange: OutlinedTextFieldProps['onChange'] = e =>
    setType(e.target.value as core.goals.goalType)
  const openMonthPopover = () => setMonthPopoverAnchor(props.anchorEl)
  const closeMonthPopover = () => setMonthPopoverAnchor(null)
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
    <>
      <Popover disableRestoreFocus onClose={onClose} {...rest}>
        <div className="grid min-w-80 gap-y-4 p-4">
          <TextField
            select
            variant="outlined"
            value={type}
            onChange={handleTypeChange}
            label={t('goalType')}
            fullWidth
          >
            <MenuItem value={core.goals.goalType.MONTHLY}>
              {t('names.monthly')}
            </MenuItem>
            <MenuItem value={core.goals.goalType.MONTHLY_SPEND}>
              {t('names.monthlySpend')}
            </MenuItem>
            <MenuItem value={core.goals.goalType.TARGET_BALANCE}>
              {t('names.targetBalance')}
            </MenuItem>
            <MenuItem value={core.goals.goalType.INCOME_PERCENT}>
              {t('names.incomePercent')}
            </MenuItem>
          </TextField>

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
                onClick={openMonthPopover}
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
      </Popover>
      <MonthSelectPopover
        open={!!monthPopoverAnchor}
        anchorEl={monthPopoverAnchor}
        onClose={closeMonthPopover}
        onChange={handleDateChange}
        value={endDate}
        disablePast
      />
    </>
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
