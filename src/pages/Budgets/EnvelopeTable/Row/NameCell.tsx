import React, { FC, memo, ReactNode } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { Typography, Box, IconButton, Collapse, Chip } from '@mui/material'
import { EmojiIcon } from '@shared/ui/EmojiIcon'
import { DragIndicatorIcon } from '@shared/ui/Icons'
import { TEnvelopeId, TFxCode } from '@shared/types'
import { DragTypes } from '../../DnDContext'
import { TEnvelope } from '@entities/envelope'
import { useDisplayCurrency } from '@entities/displayCurrency'
import { Tooltip } from '@shared/ui/Tooltip'
import { getCurrencySymbol } from '@shared/helpers/money'

export const NameCell: FC<{
  envelope: TEnvelope
  isChild?: boolean
  isSelf?: boolean
  isReordering: boolean
  isDefaultVisible: boolean
}> = memo(props => {
  const { id, symbol, color, name, currency, comment } = props.envelope
  const { isReordering, isDefaultVisible, isChild, isSelf } = props
  const [displayCurrency] = useDisplayCurrency()

  return (
    <Box
      display="flex"
      alignItems="center"
      gap={1}
      minWidth={0}
      pl={isChild ? 5 : 0}
    >
      {/* <Collapse orientation="horizontal" in={isReordering} unmountOnExit>
        <EnvDraggable id={id} />
      </Collapse> */}
      {isReordering && (
        <EnvDraggable id={id}>
          <IconButton size="small" sx={envDraggableSx}>
            <DragIndicatorIcon />
          </IconButton>
        </EnvDraggable>
      )}

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          flexShrink: 1,
          minWidth: 0,
          opacity: isDefaultVisible ? 1 : 0.5,
        }}
      >
        <EmojiIcon
          symbol={isSelf ? '–' : symbol}
          color={isSelf ? null : color}
          mr={1.5}
        />
        <Typography component="span" variant="body1" title={name} noWrap>
          {name}
          {isSelf ? ' (основная)' : ''}
        </Typography>
      </Box>

      {displayCurrency !== currency && <CurrencyTag currency={currency} />}

      {!!comment && (
        <Typography
          sx={{ flexShrink: 1000000, fontStyle: 'italic' }}
          color="text.hint"
          component="span"
          variant="body1"
          title={comment}
          noWrap
        >
          {comment}
        </Typography>
      )}
    </Box>
  )
})

const envDraggableSx = {
  my: -1,
  display: 'grid',
  placeItems: 'center',
  cursor: 'grab',
  touchAction: 'none',
}

const EnvDraggable: FC<{ id: TEnvelopeId; children: ReactNode }> = props => {
  const { id, children } = props
  const { setNodeRef, attributes, listeners } = useDraggable({
    id: 'envelope' + id,
    data: { type: DragTypes.envelope, id: id },
  })
  return (
    <span ref={setNodeRef} {...attributes} {...listeners}>
      {children}
    </span>
  )
}

const CurrencyTag: FC<{ currency?: TFxCode }> = ({ currency }) => {
  if (!currency) return null
  return (
    <Tooltip
      title={`Бюджет этой категории задаётся в ${currency}. Он будет пересчитываться автоматически по текущему курсу.`}
    >
      <Chip label={getCurrencySymbol(currency)} size="small" />
    </Tooltip>
  )
}
