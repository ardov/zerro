import { Menu, MenuItem } from '@/6-shared/ui/Menu'
import { useTranslation } from 'react-i18next'
import { useAsked } from '@/6-shared/overlays'

export type TableMenuChoice = 'showAllToggle' | 'reorderModeToggle'

export type TableMenuProps = {
  isAllShown: boolean
  isReordering: boolean
  anchorEl?: Element | null
}

/** «What should the table do?». It returns the choice; the table decides what
 * it means. */
export function TableMenu({
  isAllShown,
  isReordering,
  anchorEl,
}: TableMenuProps) {
  const { t } = useTranslation('envelopeTableMenu')
  const { open, answer } = useAsked<TableMenuChoice>()
  return (
    <Menu open={open} onClose={() => answer()} anchorEl={anchorEl}>
      <MenuItem onClick={() => answer('showAllToggle')}>
        {t(isAllShown ? 'showPrtiallyEnvelopes' : 'showAllEnvelopes')}
      </MenuItem>
      <MenuItem onClick={() => answer('reorderModeToggle')}>
        {t(isReordering ? 'leaveEditMode' : 'goToEditMode')}
      </MenuItem>
    </Menu>
  )
}
