import React, { FC, useState } from 'react'
import Dialog, { DialogProps } from '@mui/material/Dialog'
import TagChip from 'components/TagChip'
import { AmountInput } from 'components/AmountInput'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt'
import { Box, InputAdornment, IconButton } from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import { getAmountsById } from '../selectors'
import { moveFunds } from '../thunks'
import { getTotalsByMonth } from '../selectors'
import { RootState } from 'store'
import { Modify } from 'types'

type MoveMoneyModalProps = Modify<
  DialogProps,
  {
    month: number
    source: string
    destination: string
    onClose: () => void
  }
>

export const MoveMoneyModal: FC<MoveMoneyModalProps> = props => {
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

function getAvailableFor(state: RootState, month: number, id: string) {
  if (!id) return 0
  if (id === 'toBeBudgeted')
    return +getTotalsByMonth(state)?.[month]?.toBeBudgeted
  return +getAmountsById(state)?.[month]?.[id]?.available
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
