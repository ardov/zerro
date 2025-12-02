import React, { FC, useCallback, useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { Typography, Box, Popover, Stack, IconButton } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Tooltip } from '6-shared/ui/Tooltip'
import { formatMoney } from '6-shared/helpers/money'
import { WarningIcon, MoreHorizIcon } from '6-shared/ui/Icons'
import { Amount } from '6-shared/ui/Amount'
import { userSettingsModel } from '5-entities/userSettings'
import { DragTypes } from '2-pages/Budgets/DnD'
import { useIsSmall } from '../shared/shared'

type AvailableCellProps = {
  id: string
  hiddenOverspend?: number
  available: number
  budgeted: number
  activity: number
  isChild?: boolean
  isSelf?: boolean
  onBudgetClick: (e: React.MouseEvent) => void
  onActivityClick: (e: React.MouseEvent) => void
}

export const AvailableCell: FC<AvailableCellProps> = props => {
  const {
    hiddenOverspend,
    id,
    available,
    isChild,
    budgeted,
    activity,
    isSelf,
    onBudgetClick,
    onActivityClick,
  } = props
  const { t } = useTranslation(['budgets', 'common'])
  const isSmall = useIsSmall()
  const { showExtraCellMenu } = userSettingsModel.useUserSettings()
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null)
  const showPopoverIcon = isSmall && showExtraCellMenu

  const availableColor = getAvailableColor(
    available,
    isChild,
    !!budgeted,
    isSelf
  )

  const handleOpenPopover = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      setPopoverAnchor(e.currentTarget)
    },
    []
  )

  const handleClosePopover = useCallback(() => {
    setPopoverAnchor(null)
  }, [])

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
      {showPopoverIcon && (
        <IconButton
          size="small"
          onClick={handleOpenPopover}
          sx={{
            p: 0.25,
            mr: 0.5,
            opacity: 0.5,
            '&:hover': { opacity: 1 },
          }}
        >
          <MoreHorizIcon fontSize="small" />
        </IconButton>
      )}

      <Typography variant="body1" align="right">
        {!!hiddenOverspend && (
          <Tooltip
            title={
              <span>
                {t('parentOverspend', {
                  amount: formatMoney(-hiddenOverspend),
                })}
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
              display: 'inline-block',
              color: availableColor,
            }}
          >
            <Amount value={available} decimals="ifOnly" />
          </Box>
        </DraggableAmount>
      </Typography>

      <Popover
        open={Boolean(popoverAnchor)}
        anchorEl={popoverAnchor}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              p: 1.5,
              minWidth: 160,
            },
          },
        }}
      >
        <Stack spacing={1}>
          <Box
            onClick={e => {
              handleClosePopover()
              onBudgetClick(e)
            }}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 2,
              px: 1,
              py: 0.5,
              borderRadius: 1,
              cursor: 'pointer',
              '&:hover': { bgcolor: 'action.hover' },
              '&:active': { bgcolor: 'action.focus' },
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {t('budget', { ns: 'common' })}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: isSelf
                  ? 'text.disabled'
                  : budgeted
                    ? 'text.primary'
                    : 'text.disabled',
              }}
            >
              <Amount value={budgeted} decMode="ifOnly" />
            </Typography>
          </Box>
          <Box
            onClick={e => {
              handleClosePopover()
              onActivityClick(e)
            }}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 2,
              px: 1,
              py: 0.5,
              borderRadius: 1,
              cursor: 'pointer',
              '&:hover': { bgcolor: 'action.hover' },
              '&:active': { bgcolor: 'action.focus' },
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {t('activity', { ns: 'common' })}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: activity ? 'text.primary' : 'text.disabled' }}
            >
              <Amount value={activity} decMode="ifOnly" />
            </Typography>
          </Box>
        </Stack>
      </Popover>
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
  const neutral = 'text.disabled'

  if (isSelf) return neutral

  if (available === 0) return neutral
  if (available > 0) return positive

  // available < 0
  // main tag or child with budget
  if (!isChild || hasBudget) return negative
  // child tag without budget
  else return neutral
}
