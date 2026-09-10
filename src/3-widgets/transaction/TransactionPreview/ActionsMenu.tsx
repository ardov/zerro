import type { FC, ReactNode } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IconButton } from '@/6-shared/ui/Button'
import {
  DeleteIcon,
  MoreVertIcon,
  RestoreFromTrashIcon,
  SyncIcon,
  VisibilityIcon,
} from '@/6-shared/ui/Icons'
import { Menu, MenuItem } from '@/6-shared/ui/Menu'
import { ListRowIcon, ListRowText } from '@/6-shared/ui/ListRow'
import { usePopup } from '@/6-shared/overlays'

export type TransactionActions = {
  onDelete: () => void
  onRestore: () => void
  onSetViewed: (viewed: boolean) => void
  /** Only offered where the surface has somewhere to show the result. */
  onSelectSimilar?: () => void
}

/** Everything that can be done to a transaction other than edit it.
 *
 * Kept in a menu so metadata and lifecycle actions do not become a row of
 * competing buttons in a header that has no room for them. */
export const ActionsMenu: FC<
  TransactionActions & { deleted: boolean; viewed: boolean }
> = ({
  deleted,
  viewed,
  onDelete,
  onRestore,
  onSetViewed,
  onSelectSimilar,
}) => {
  const { t } = useTranslation(['transaction', 'transactionContextMenu'])
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
        {!deleted &&
          item(
            'viewed',
            <VisibilityIcon size={20} />,
            t(
              viewed
                ? 'transactionContextMenu:markUnviewed'
                : 'transactionContextMenu:markViewed'
            ),
            () => onSetViewed(!viewed)
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
