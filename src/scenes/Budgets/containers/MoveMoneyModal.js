import React, { useState } from 'react'
import Dialog from '@material-ui/core/Dialog'
import TagChip from 'components/TagChip'
import AmountInput from 'components/AmountInput'
import ArrowForwardIcon from '@material-ui/icons/ArrowForward'
import ArrowRightAltIcon from '@material-ui/icons/ArrowRightAlt'
import { Box, InputAdornment, IconButton } from '@material-ui/core'

export default function MoveMoneyModal({
  open,
  onClose,
  source,
  destination,
  onMoneyMove,
}) {
  const [amount, setAmount] = useState(1000)
  const handleSubmit = () => {
    if (amount) {
      onMoneyMove(amount)
    } else {
      onClose()
    }
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
