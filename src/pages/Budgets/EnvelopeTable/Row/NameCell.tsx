import React, { FC, ReactNode } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { Typography, Box, IconButton, Collapse } from '@mui/material'
import { EmojiIcon } from '@shared/ui/EmojiIcon'
import { DragIndicatorIcon } from '@shared/ui/Icons'
import { TEnvelopeId } from '@shared/types'
import { DragTypes } from '../../DnDContext'
import { TEnvelope } from '@entities/envelope'
import { CurrencyTag } from './Row'

export const NameCell: FC<{
  envelope: TEnvelope
  isChild: boolean
  isReordering: boolean
  isDefaultVisible: boolean
  hasCustomCurency: boolean
}> = props => {
  const { id, symbol, color, name, currency, comment } = props.envelope
  const { isReordering, isDefaultVisible, hasCustomCurency, isChild } = props

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
        <EmojiIcon symbol={symbol} mr={1.5} color={color} />
        <Typography component="span" variant="body1" title={name} noWrap>
          {name}
        </Typography>
      </Box>

      {hasCustomCurency && <CurrencyTag currency={currency} />}

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
}

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
