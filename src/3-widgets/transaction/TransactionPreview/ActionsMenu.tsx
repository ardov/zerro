import type { FC, ReactNode } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IconButton } from '@/6-shared/ui/Button'
import {
  DeleteIcon,
  MoreVertIcon,
  RestoreFromTrashIcon,
  SyncIcon,
} from '@/6-shared/ui/Icons'
import { Menu, MenuItem } from '@/6-shared/ui/Menu'
import { ListRowIcon, ListRowText } from '@/6-shared/ui/ListRow'
import { usePopup } from '@/6-shared/overlays'

export type TransactionActions = {
  onDelete: () => void
  onRestore: () => void
  /** Only offered where the surface has somewhere to show the result. */
  onSelectSimilar?: () => void
}

/** Everything that can be done to a transaction other than edit it.
 *
 * One item today, because deleting is the only one that has moved here; the
 * menu exists so the next one does not have to become another button in a
 * header that has no room for it. */
export const ActionsMenu: FC<TransactionActions & { deleted: boolean }> = ({
  deleted,
  onDelete,
  onRestore,
  onSelectSimilar,
}) => {
  const { t } = useTranslation('transaction')
  // On the overlay stack, so Back closes the menu rather than the editor
  // underneath it.
  const [open, setOpen] = usePopup()
  const [anchor, setAnchor] = useState<Element | null>(null)

  const run = (action: () => void) => () => {
    setOpen(false)
    action()
  }

  const item = (
    key: string,
    icon: ReactNode,
    label: string,
    act: () => void
  ) => (
    <MenuItem key={key} onClick={run(act)}>
      <ListRowIcon>{icon}</ListRowIcon>
      <ListRowText>{label}</ListRowText>
    </MenuItem>
  )

  return (
    <>
      <IconButton
        size="small"
        aria-label={t('btnActions')}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={event => {
          setAnchor(event.currentTarget)
          setOpen(true)
        }}
      >
        <MoreVertIcon size={20} />
      </IconButton>
      <Menu
        open={open}
        onClose={() => setOpen(false)}
        anchorEl={anchor}
        aria-label={t('btnActions')}
      >
        {onSelectSimilar &&
          item(
            'similar',
            <SyncIcon size={20} />,
            t('btnOtherFromSync'),
            onSelectSimilar
          )}
        {deleted
          ? item(
              'restore',
              <RestoreFromTrashIcon size={20} />,
              t('btnRestore'),
              onRestore
            )
          : item('delete', <DeleteIcon size={20} />, t('btnDelete'), onDelete)}
      </Menu>
    </>
  )
}
