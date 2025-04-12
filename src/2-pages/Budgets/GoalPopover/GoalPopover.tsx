import React, { useState, FC } from 'react'
import {
  Box,
  Popover,
  TextField,
  MenuItem,
  Button,
  IconButton,
  OutlinedTextFieldProps,
  PopoverProps,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { AmountInput } from '6-shared/ui/AmountInput'
import { CloseIcon } from '6-shared/ui/Icons'
import MonthSelectPopover from '6-shared/ui/MonthSelectPopover'
import { toISODate, formatDate } from '6-shared/helpers/date'
import { Modify, TDateDraft, TISOMonth } from '6-shared/types'

import { useAppDispatch } from 'store'
import { goalModel, goalType, TGoal } from '5-entities/goal'
import { envelopeModel, TEnvelopeId } from '5-entities/envelope'

export type TGoalPopoverProps = Modify<
  PopoverProps,
  { onClose: () => void }
> & {
  id: TEnvelopeId
  month: TISOMonth
}

export const GoalPopover: FC<TGoalPopoverProps> = props => {
  const { id, month, onClose, ...rest } = props
  const { t } = useTranslation('goals')
  const dispatch = useAppDispatch()
  const envelope = envelopeModel.useEnvelopes()[id]
  const goalInfo = goalModel.useGoals()[month][id] || {}
  const { goal } = goalInfo

  const [type, setType] = useState(goal?.type || goalType.MONTHLY_SPEND)
  const isInPercents = type === goalType.INCOME_PERCENT
  const [rawValue, setRawValue] = useState(getInput(goal?.amount))
  const [endDate, setEndDate] = useState<TGoal['end']>(goal?.end)

  const [monthPopoverAnchor, setMonthPopoverAnchor] =
    useState<(typeof props)['anchorEl']>(null)
  if (!id || !month) return null

  const handleTypeChange: OutlinedTextFieldProps['onChange'] = e =>
    setType(e.target.value as goalType)
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
      const goal: TGoal = { type, amount }
      if (type === goalType.TARGET_BALANCE && endDate) {
        goal.end = endDate
      }
      dispatch(goalModel.set(month, id, goal))
    }
    onClose?.()
  }
  const removeGoal = () => {
    dispatch(goalModel.set(month, id, null))
    onClose?.()
  }

  const showDateBlock = type === goalType.TARGET_BALANCE

  const amountLabels = {
    [goalType.MONTHLY]: t('inputLabels.monthly'),
    [goalType.MONTHLY_SPEND]: t('inputLabels.monthlySpend'),
    [goalType.TARGET_BALANCE]: t('inputLabels.targetBalance'),
    [goalType.INCOME_PERCENT]: t('inputLabels.incomePercent'),
  }

  return (
    <>
      <Popover disableRestoreFocus onClose={onClose} {...rest}>
        <Box
          sx={{
            display: 'grid',
            rowGap: 2,
            p: 2,
            minWidth: 320,
          }}
        >
          <TextField
            select
            variant="outlined"
            value={type}
            onChange={handleTypeChange}
            label={t('goalType')}
            fullWidth
          >
            <MenuItem value={goalType.MONTHLY}>{t('names.monthly')}</MenuItem>
            <MenuItem value={goalType.MONTHLY_SPEND}>
              {t('names.monthlySpend')}
            </MenuItem>
            <MenuItem value={goalType.TARGET_BALANCE}>
              {t('names.targetBalance')}
            </MenuItem>
            <MenuItem value={goalType.INCOME_PERCENT}>
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
            <Box
              sx={{
                display: 'flex',
              }}
            >
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
            </Box>
          )}

          <Button onClick={save} variant="contained" color="primary">
            {t('save')}
          </Button>
          {!!goal?.amount && (
            <Button onClick={removeGoal} variant="outlined" color="error">
              {t('remove')}
            </Button>
          )}
        </Box>
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
