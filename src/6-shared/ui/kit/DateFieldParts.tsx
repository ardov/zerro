import { useTranslation } from 'react-i18next'
import type { TISODate } from '@/6-shared/types'
import { usePopup } from '@/6-shared/overlays'
import { CalendarIcon } from '@/6-shared/ui/Icons'
import { Calendar } from './Calendar'
import { Popover } from './Popover'
import { IconButton } from './Button'
import { FieldAddon } from './Field'

/** Keep native segmented editing, with the kit calendar as the picker. */
export const nativeDateTimeControlClass =
  'appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-datetime-edit]:p-0'

export function DateCalendarAction({
  value,
  onChange,
  anchor,
  label,
}: {
  value: TISODate | null
  onChange: (value: TISODate) => void
  anchor: HTMLElement | null
  label?: string
}) {
  const { t } = useTranslation()
  const popup = usePopup()
  const name = label ?? t('selectDate')
  return (
    <FieldAddon kind="action">
      <Popover
        popup={popup}
        anchor={anchor}
        label={name}
        className="w-fit"
        contentClassName="flex justify-center p-1"
        trigger={
          <IconButton label={name} variant="ghost" size="sm" tooltip={false}>
            <CalendarIcon />
          </IconButton>
        }
      >
        <Calendar
          autoFocus
          value={value}
          onChange={next => {
            popup.setOpen(false)
            onChange(next)
          }}
        />
      </Popover>
    </FieldAddon>
  )
}
