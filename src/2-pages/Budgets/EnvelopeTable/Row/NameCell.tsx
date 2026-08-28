import { IconButton } from '6-shared/ui/Button'
import type { FC, ReactNode } from 'react'
import { memo, useCallback, useRef } from 'react'
import { core } from 'zerro-core/redux'

import { useDraggable } from '@dnd-kit/core'
import { Chip } from '@mui/material'
import { useTranslation } from 'react-i18next'

import { TagIcon } from '6-shared/ui/TagIcon'
import { DragIndicatorIcon } from '6-shared/ui/Icons'
import type { TFxCode } from '6-shared/types'
import { Tooltip } from '6-shared/ui/Tooltip'
import { getCurrencySymbol } from '6-shared/helpers/money'
import { useFloatingInput } from '6-shared/ui/FloatingInput'
import { useAppDispatch } from 'store/index'

import { DragTypes } from '2-pages/Budgets/DnD'

export const NameCell: FC<{
  envelope: core.envelopes.TPresentedEnvelope
  isChild?: boolean
  isSelf?: boolean
  isReordering: boolean
  isDefaultVisible: boolean
  onClick?: () => void
}> = memo(props => {
  const { id, symbol, colorHex, name, currency, comment, originalName } =
    props.envelope
  const { isReordering, isDefaultVisible, isChild, isSelf, onClick } = props
  const [displCurrency] = core.currency.useDisplayCurrency()
  const { t } = useTranslation('budgets')

  const dispatch = useAppDispatch()
  const ref = useRef<HTMLSpanElement>(null)
  const updateName = useCallback(
    (v: string) => {
      dispatch(core.envelopes.rename(id, v))
    },
    [dispatch, id]
  )
  const floating = useFloatingInput(ref, updateName)

  return (
    <div
      onClick={onClick}
      className={`flex min-w-0 items-center gap-2 ${isChild ? 'pl-10' : ''}`}
    >
      {/* <Collapse orientation="horizontal" in={isReordering} unmountOnExit>
        <EnvDraggable id={id} />
      </Collapse> */}
      {isReordering && (
        <EnvDraggable id={id}>
          <IconButton size="small" className="-my-2 grid place-items-center">
            <DragIndicatorIcon />
          </IconButton>
        </EnvDraggable>
      )}
      <div
        className={`flex min-w-0 shrink items-center justify-center ${isDefaultVisible ? 'opacity-100' : 'opacity-50'}`}
      >
        <TagIcon
          symbol={isSelf ? '–' : symbol}
          color={isSelf ? null : colorHex}
          className="mr-3"
        />
        <span
          className="truncate type-body"
          title={name}
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
        </span>
      </div>
      {displCurrency !== currency && <CurrencyTag currency={currency} />}
      {!!comment && (
        <span
          title={comment}
          className="shrink truncate type-body italic text-disabled-foreground"
        >
          {comment}
        </span>
      )}
      {floating.render()}
    </div>
  )
})

const EnvDraggable: FC<{
  id: core.envelopes.TEnvelopeId
  children: ReactNode
}> = props => {
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
