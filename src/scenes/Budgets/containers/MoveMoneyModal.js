import React, { useState } from 'react'
import Dialog from '@material-ui/core/Dialog'
import TagChip from 'components/TagChip'
import AmountInput from 'components/AmountInput'
import ArrowForwardIcon from '@material-ui/icons/ArrowForward'
import ArrowRightAltIcon from '@material-ui/icons/ArrowRightAlt'
import { Box, InputAdornment, IconButton } from '@material-ui/core'
import { useSelector, useDispatch } from 'react-redux'
import { getAmountsForTag } from '../selectors/getAmountsByTag'
import { moveFunds } from '../thunks'
import { getTotalsByMonth } from '../selectors/getTotalsByMonth'

export function MoveMoneyModal(props) {
  const dispatch = useDispatch()
  const { open, onClose, source, month, destination } = props
  const sourceAvailable = useSelector(state =>
    getAvailableFor(state, month, source)
  )
  const destinationAvailable = useSelector(state =>
    getAvailableFor(state, month, destination)
  )
  const suggestedAmount = suggestAmount(
    sourceAvailable,
    destinationAvailable,
    1000
  )

  const [amount, setAmount] = useState(suggestedAmount)
  const handleSubmit = () => {
    if (amount) dispatch(moveFunds(amount, source, destination, month))
    onClose()
  }
  return (
    <Dialog open={open} onClose={onClose}>
      <Box display="flex" flexDirection="column" p={2}>
        <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
          <TagChip id={source} />
          <Box mx={1} display="flex" alignItems="center">
            <ArrowRightAltIcon />
          </Box>
          <TagChip id={destination} />
        </Box>
        <AmountInput
          value={amount}
          onChange={setAmount}
          onEnter={handleSubmit}
          autoFocus
          selectOnFocus
          fullWidth
          placeholder="0"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton edge="end" onClick={handleSubmit}>
                  <ArrowForwardIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>
    </Dialog>
  )
}

function getAvailableFor(state, month, id) {
  if (!id) return 0
  if (id === 'toBeBudgeted')
    return +getTotalsByMonth(state)?.[month]?.toBeBudgeted
  return +getAmountsForTag(state)(month, id)?.available
}

function suggestAmount(from = 0, to = 0, defaultAmount = 1000) {
  // No money to move --> 0
  if (from <= 0) return 0
  // Enough money to cover overspent --> overspent
  if (to < 0 && from >= -to) return -to
  // Not enough money to cover overspent --> move all we have
  if (to < 0 && from < -to) return from
  // Less money than default value --> move all we have
  if (to >= 0 && from < defaultAmount) return from
  // Else move default value
  return defaultAmount
}
