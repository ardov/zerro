import React, { FC, memo, ReactNode, useCallback, useRef } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { Typography, Box, IconButton, Collapse, Chip } from '@mui/material'
import { useTranslation } from 'react-i18next'

import { EmojiIcon } from '6-shared/ui/EmojiIcon'
import { DragIndicatorIcon } from '6-shared/ui/Icons'
import { TFxCode } from '6-shared/types'
import { Tooltip } from '6-shared/ui/Tooltip'
import { getCurrencySymbol } from '6-shared/helpers/money'
import { useFloatingInput } from '6-shared/ui/FloatingInput'
import { useAppDispatch } from 'store/index'
import { envelopeModel, TEnvelope, TEnvelopeId } from '5-entities/envelope'
import { displayCurrency } from '5-entities/currency/displayCurrency'
import { DragTypes } from '2-pages/Budgets/DnD'

export const NameCell: FC<{
  envelope: TEnvelope
  isChild?: boolean
  isSelf?: boolean
  isReordering: boolean
  isDefaultVisible: boolean
  onClick?: () => void
}> = memo(props => {
  const { id, symbol, color, name, currency, comment, originalName } =
    props.envelope
  const { isReordering, isDefaultVisible, isChild, isSelf, onClick } = props
  const [displCurrency] = displayCurrency.useDisplayCurrency()
  const { t } = useTranslation('budgets')

  const dispatch = useAppDispatch()
  const ref = useRef<any>()
  const updateName = useCallback(
    (v: string) => {
      dispatch(envelopeModel.patchEnvelope({ id, originalName: v }))
    },
    [dispatch, id]
  )
  const floating = useFloatingInput(ref, updateName)

  return (
    <Box
      display="flex"
      alignItems="center"
      gap={1}
      minWidth={0}
      onClick={onClick}
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
        <Typography
          component="span"
          variant="body1"
          title={name}
          noWrap
          ref={ref}
          onClick={e => {
            if (e.altKey) {
              e.preventDefault()
              e.stopPropagation()
              floating.open(originalName)
            }
          }}
        >
          {isSelf ? `${name} ${t('isSelf')}` : name}
        </Typography>
      </Box>

      {displCurrency !== currency && <CurrencyTag currency={currency} />}

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

      {floating.render()}
    </Box>
  )
})

const envDraggableSx = {
  my: -1,
  display: 'grid',
  placeItems: 'center',
}

const EnvDraggable: FC<{ id: TEnvelopeId; children: ReactNode }> = props => {
  const { id, children } = props
  const { setNodeRef, attributes, listeners } = useDraggable({
    id: 'envelope' + id,
    data: { type: DragTypes.envelope, id: id },
  })
  return (
    <span
      style={{
        userSelect: 'none',
        cursor: 'grab',
        touchAction: 'manipulation',
      }}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
    >
      {children}
    </span>
  )
}

const CurrencyTag: FC<{ currency?: TFxCode }> = ({ currency }) => {
  const { t } = useTranslation('budgets')
  if (!currency) return null
  return (
    <Tooltip title={t('envelopeCurrencyTooltip', { currency })}>
      <Chip label={getCurrencySymbol(currency)} size="small" />
    </Tooltip>
  )
}
