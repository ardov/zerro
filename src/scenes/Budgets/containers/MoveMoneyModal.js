import React, { useState } from 'react'
import Dialog from '@material-ui/core/Dialog'
import TagChip from 'components/TagChip'
import AmountInput from 'components/AmountInput'
import ArrowForwardIcon from '@material-ui/icons/ArrowForward'
import ArrowRightAltIcon from '@material-ui/icons/ArrowRightAlt'
import { Box, InputAdornment, IconButton } from '@material-ui/core'
import { connect } from 'react-redux'
import { getTagAmounts } from '../selectors/getAmountsByTag'

export function MoveMoneyModal({
  open,
  onClose,
  source,
  month,
  sourceAvailable,
  destinationAvailable,
  destination,
  onMoneyMove,
}) {
  const [amount, setAmount] = useState(
    getDefaultAmount(sourceAvailable, destinationAvailable, 1000)
  )
  const handleSubmit = () => {
    if (amount) onMoneyMove(amount)
    else onClose()
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

const mapStateToProps = (state, { source, destination, month }) => ({
  sourceAvailable:
    source && source !== 'toBeBudgeted'
      ? getTagAmounts(state, month, source === 'null' ? null : source)
          ?.available
      : 0,
  destinationAvailable:
    destination && destination !== 'toBeBudgeted'
      ? getTagAmounts(state, month, destination === 'null' ? null : destination)
          ?.available
      : 0,
})

export default connect(mapStateToProps, null)(MoveMoneyModal)

function getDefaultAmount(from = 0, to = 0, defaultAmount = 1000) {
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
