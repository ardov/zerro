import React, { FC } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { Typography, Box } from '@mui/material'
import { Tooltip } from '6-shared/ui/Tooltip'
import { formatMoney } from '6-shared/helpers/money'
import { WarningIcon } from '6-shared/ui/Icons'
import { Amount } from '6-shared/ui/Amount'
import { DragTypes } from '../../DnDContext'

type AvailableCellProps = {
  id: string
  hiddenOverspend?: number
  available: number
  budgeted: number
  isChild?: boolean
  isSelf?: boolean
}

export const AvailableCell: FC<AvailableCellProps> = props => {
  const { hiddenOverspend, id, available, isChild, budgeted, isSelf } = props
  const availableColor = getAvailableColor(
    available,
    isChild,
    !!budgeted,
    isSelf
  )

  return (
    <Box>
      <Typography variant="body1" align="right">
        {!!hiddenOverspend && (
          <Tooltip
            title={
              <span>
                Перерасход в родительской категории.
                <br />
                {`Увеличьте бюджет на ${formatMoney(-hiddenOverspend)}`}
              </span>
            }
          >
            <WarningIcon
              fontSize="small"
              color="warning"
              sx={{ transform: 'translate(-6px, 4px)' }}
            />
          </Tooltip>
        )}

        <DraggableAmount id={id} type={DragTypes.amount} disabled={isSelf}>
          <Box
            component="span"
            sx={{
              borderRadius: 1,
              px: 2,
              mx: -2,
              py: 0.5,
              my: -0.5,
              component: 'span',
              display: 'inline-block',
              color: availableColor,
            }}
          >
            <Amount value={available} decMode="ifOnly" />
          </Box>
        </DraggableAmount>
      </Typography>
    </Box>
  )
}

const DraggableAmount: FC<{
  id: string
  children: React.ReactNode
  type: DragTypes
  disabled?: boolean
}> = props => {
  const { id, children, disabled, type } = props
  const { setNodeRef, attributes, listeners } = useDraggable({
    id: 'amount' + id,
    disabled,
    data: { type, id },
  })
  return (
    <span
      style={{
        userSelect: 'none',
        touchAction: 'manipulation',
        cursor: 'grab',
      }}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
    >
      {children}
    </span>
  )
}

function getAvailableColor(
  available: number,
  isChild?: boolean,
  hasBudget?: boolean,
  isSelf?: boolean
) {
  const positive = 'success.main'
  const negative = 'error.main'
  const neutral = 'text.hint'

  if (isSelf) return neutral

  if (available === 0) return neutral
  if (available > 0) return positive

  // available < 0
  // main tag or child with budget
  if (!isChild || hasBudget) return negative
  // child tag without budget
  else return neutral
}
