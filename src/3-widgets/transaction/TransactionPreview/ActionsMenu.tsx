import { useTranslation } from 'react-i18next'
import { IconButton } from '@/6-shared/ui/kit/Button'
import { Menu, type MenuItem } from '@/6-shared/ui/kit/Menu'
import {
  DeleteIcon,
  MoreVertIcon,
  RestoreFromTrashIcon,
  SyncIcon,
  VisibilityIcon,
} from '@/6-shared/ui/Icons'

export type TransactionActions = {
  onDelete: () => void
  onRestore: () => void
  onSetViewed: (viewed: boolean) => void
  /** Only offered where the surface has somewhere to show the result. */
  onSelectSimilar?: () => void
}

export function ActionsMenu(
  props: TransactionActions & { deleted: boolean; viewed: boolean }
) {
  const { deleted, viewed, onDelete, onRestore, onSetViewed, onSelectSimilar } =
    props
  const { t } = useTranslation(['transaction', 'transactionContextMenu'])
  const items: MenuItem[] = []
  if (onSelectSimilar)
    items.push({
      id: 'similar',
      start: <SyncIcon />,
      label: t('btnOtherFromSync'),
      onSelect: onSelectSimilar,
    })
  if (!deleted)
    items.push({
      id: 'viewed',
      start: <VisibilityIcon />,
      label: t(
        viewed
          ? 'transactionContextMenu:markUnviewed'
          : 'transactionContextMenu:markViewed'
      ),
      onSelect: () => onSetViewed(!viewed),
    })
  items.push(
    deleted
      ? {
          id: 'restore',
          start: <RestoreFromTrashIcon />,
          label: t('btnRestore'),
          onSelect: onRestore,
        }
      : {
          id: 'delete',
          start: <DeleteIcon />,
          label: t('btnDelete'),
          destructive: true,
          onSelect: onDelete,
        }
  )
  return (
    <Menu
      label={t('btnActions')}
      items={items}
      trigger={
        <IconButton variant="ghost" size="sm" label={t('btnActions')}>
          <MoreVertIcon />
        </IconButton>
      }
    />
  )
}
