import type { FC } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TAccountId } from '@/6-shared/types'
import { Popover } from '@/6-shared/ui/Popover'
import { surfacePadding } from '@/6-shared/ui/overlaySurface'
import { AccountIcon, ChevronDownIcon } from '@/6-shared/ui/Icons'
import type { FilledFieldState } from '@/6-shared/ui/FilledField'
import { FilledButton } from '@/6-shared/ui/FilledField'
import {
  ListRowBacking,
  listRowClass,
  ListRowText,
} from '@/6-shared/ui/ListRow'
import { usePopup } from '@/6-shared/overlays'
import { cn } from '@/6-shared/ui/shadcn/utils'
import { core } from '@/zerro-core/redux'

type TAccountOption = {
  id: TAccountId
  title: string
  fxCode: string
  archive: boolean
}

export type AccountFieldProps = FilledFieldState & {
  value: TAccountId
  onChange: (id: TAccountId) => void
  options: TAccountOption[]
  /** What the field is for, when a form has more than one of them. */
  label: string
  className?: string
}

/** The account a leg of the transaction touches.
 *
 * The glyph slot is where a bank's own mark belongs once there is one to
 * draw. Until then it is the generic account glyph, and the field carries no
 * badge behind it — a plain glyph beside a name is a field, and a plain glyph
 * on a coloured tile is a logo that is not there. */
export const AccountField: FC<AccountFieldProps> = ({
  value,
  onChange,
  options,
  label,
  className,
  ...state
}) => {
  const { t } = useTranslation('transaction')
  const [open, setOpen] = usePopup()
  const [anchor, setAnchor] = useState<Element | null>(null)
  const accounts = core.accounts.usePopulated()
  const current = accounts[value]

  return (
    <>
      <FilledButton
        {...state}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        icon={<AccountIcon size={20} />}
        trailing={
          <ChevronDownIcon size={20} className="text-icon-foreground" />
        }
        className={className}
        onClick={event => {
          setAnchor(event.currentTarget)
          setOpen(true)
        }}
      >
        {current?.title ?? t('accountMissing')}
      </FilledButton>

      <Popover
        open={open}
        onClose={() => setOpen(false)}
        anchorEl={anchor}
        placement="over"
        align="start"
        alignOffset={-surfacePadding}
        sideOffset={-surfacePadding}
        aria-label={label}
        className="max-h-[60vh] min-w-[calc(var(--anchor-width)+8px)] scroll-p-1 overflow-y-auto p-1"
      >
        <ul role="listbox" className="m-0 flex list-none flex-col p-0">
          {options.map(option => (
            <li key={option.id} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={option.id === value}
                data-selected={option.id === value || undefined}
                className={cn(listRowClass, 'gap-2')}
                onClick={() => {
                  setOpen(false)
                  onChange(option.id)
                }}
              >
                <ListRowBacking selected={option.id === value} />
                <AccountIcon size={20} className="text-icon-foreground" />
                <ListRowText
                  className={cn(
                    'truncate',
                    option.archive && 'opacity-disabled'
                  )}
                >
                  {option.title}
                </ListRowText>
                <span className="ml-2 shrink-0 text-body-sm text-muted-foreground">
                  {option.fxCode}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Popover>
    </>
  )
}
