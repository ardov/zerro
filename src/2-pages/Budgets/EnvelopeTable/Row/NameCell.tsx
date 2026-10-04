import { IconButton } from '@/6-shared/ui/kit/Button'
import type { FC, ReactNode } from 'react'
import { memo, useRef } from 'react'
import { core } from '@/zerro-core/redux'

import { useDraggable } from '@dnd-kit/core'
import { Chip } from '@/6-shared/ui/Chip'
import { useTranslation } from 'react-i18next'

import { TagIcon } from '@/6-shared/ui/TagIcon'
import { DragIndicatorIcon } from '@/6-shared/ui/Icons'
import type { TFxCode } from '@/6-shared/types'
import { Tooltip } from '@/6-shared/ui/kit/Tooltip'
import { getCurrencySymbol } from '@/6-shared/helpers/money'
import { useAppDispatch } from '@/store/index'
import { useAsk } from '@/6-shared/overlays'
import { RenamePopover } from '../RenamePopover'

import { DragTypes } from '@/2-pages/Budgets/DnD'

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
  const ask = useAsk()
  const rename = async () => {
    const next = await ask<string>(
      <RenamePopover value={originalName} anchor={ref.current} />
    )
    if (next !== undefined) dispatch(core.envelopes.rename(id, next))
  }

  return (
    <div
      onClick={onClick}
      className={`flex min-w-0 items-center gap-2 ${isChild ? 'pl-10' : ''}`}
    >
      {isReordering && (
        <EnvDraggable id={id}>
          <IconButton
            size="xs"
            variant="ghost"
            label={t('reorderCategory', { name })}
            tooltip={false}
            className="-my-2"
          >
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
          className="truncate text-body"
          title={name}
          ref={ref}
          onClick={e => {
            if (e.altKey) {
              e.preventDefault()
              e.stopPropagation()
              void rename()
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
          className="shrink truncate text-body italic text-disabled-foreground"
        >
          {comment}
        </span>
      )}
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
    <Tooltip content={t('envelopeCurrencyTooltip', { currency })}>
      <Chip label={getCurrencySymbol(currency)} size="small" />
    </Tooltip>
  )
}
