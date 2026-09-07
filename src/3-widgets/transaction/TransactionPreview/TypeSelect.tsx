import type { FC } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ButtonBase } from '@/6-shared/ui/Button'
import { ChevronDownIcon } from '@/6-shared/ui/Icons'
import { Menu, MenuItem } from '@/6-shared/ui/Menu'
import { CheckIcon } from '@/6-shared/ui/Icons'
import { ListRowText } from '@/6-shared/ui/ListRow'
import { usePopup } from '@/6-shared/overlays'
import type { TDraftType } from './draft'

/** Every type a transaction can be turned into, in the order the menu offers
 * them. The two debt directions are last because they are the two a person
 * reaches for least, and one of them may not be offered at all. */
export const draftTypes = [
  'outcome',
  'income',
  'transfer',
  'outcomeDebt',
  'incomeDebt',
] as const satisfies readonly TDraftType[]

/** The heading of the editor, and the control that changes what is being
 * edited. It is one thing rather than two because the title of this surface
 * *is* the transaction's type — a separate switch below it would say the same
 * word twice. */
export const TypeSelect: FC<{
  value: TDraftType
  onChange: (type: TDraftType) => void
  /** Types this transaction cannot become, with the reason left to the
   * caller: no second account for a transfer, no debt account for a debt. */
  unavailable?: readonly TDraftType[]
}> = ({ value, onChange, unavailable = [] }) => {
  const { t } = useTranslation('transaction')
  const [open, setOpen] = usePopup()
  const [anchor, setAnchor] = useState<Element | null>(null)

  return (
    <>
      <ButtonBase
        onClick={event => {
          setAnchor(event.currentTarget)
          setOpen(true)
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        className="-mx-2 gap-1 rounded-lg px-2 py-1 hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {/* A span rather than a heading: this is the label of the button
            that changes the type, and a heading is not phrasing content. */}
        <span className="truncate type-title">{t(`type_${value}`)}</span>
        <ChevronDownIcon size={16} className="text-icon-foreground" />
      </ButtonBase>

      <Menu
        open={open}
        onClose={() => setOpen(false)}
        anchorEl={anchor}
        aria-label={t('typeLabel')}
      >
        {draftTypes.map(type => (
          <MenuItem
            key={type}
            selected={type === value}
            disabled={unavailable.includes(type)}
            onClick={() => {
              setOpen(false)
              if (type !== value) onChange(type)
            }}
          >
            <ListRowText>{t(`type_${type}`)}</ListRowText>
            {type === value && (
              <span className="ml-4 inline-flex shrink-0 items-center text-primary">
                <CheckIcon size={20} />
              </span>
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
