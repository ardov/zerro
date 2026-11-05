import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { toISOMonth } from '@/6-shared/helpers/date'
import type { TDateDraft, TISOMonth } from '@/6-shared/types'
import { PopoverSurface } from './kit/Popover'
import { MonthPicker, type MonthPickerHandle } from './kit/MonthPicker'

type MonthSelectPopoverProps = {
  open: boolean
  anchorEl?: Element | null
  onClose: () => void
  onChange: (month: TISOMonth) => void
  value?: TDateDraft
  minMonth?: TDateDraft
  maxMonth?: TDateDraft
  disablePast?: boolean
}

/** Shared surface adapter; MonthPicker owns the calendar interaction. */
export default function MonthSelectPopover(props: MonthSelectPopoverProps) {
  const {
    open,
    anchorEl,
    onClose,
    onChange,
    value,
    minMonth,
    maxMonth,
    disablePast,
  } = props
  const { t } = useTranslation()
  const picker = useRef<MonthPickerHandle>(null)
  const today = toISOMonth(new Date())
  const min = minMonth ? toISOMonth(minMonth) : undefined
  return (
    <PopoverSurface
      label={t('selectMonth')}
      controller={{
        open,
        setOpen: next => {
          if (!next) onClose()
        },
      }}
      anchor={anchorEl}
      finalFocus={() => (anchorEl instanceof HTMLElement ? anchorEl : true)}
      mobile="popover"
      className="w-max"
      contentClassName="p-0"
      initialFocus={() => {
        picker.current?.focus()
        return false
      }}
    >
      <MonthPicker
        ref={picker}
        value={value ? toISOMonth(value) : null}
        onChange={onChange}
        minMonth={disablePast && (!min || min < today) ? today : min}
        maxMonth={maxMonth ? toISOMonth(maxMonth) : undefined}
      />
    </PopoverSurface>
  )
}
