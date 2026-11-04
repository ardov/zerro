import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store'
import { formatDate } from '@/6-shared/helpers/date'
import { BackupFolderIcon, WarningIcon } from '@/6-shared/ui/Icons'
import { Menu, type MenuItem } from '@/6-shared/ui/kit/Menu'
import { ListRowButton } from '@/6-shared/ui/kit/ListRow'
import { backupProblemKey, useBackupFolder } from './useBackupFolder'
import {
  chooseBackupFolder,
  disableFolderBackups,
  resumeBackupFolder,
  selectBackupUser,
} from './dailyBackup'

export function BackupFolderItem() {
  const userId = useAppSelector(selectBackupUser)
  return userId === null ? null : <FolderRow key={userId} userId={userId} />
}

function FolderRow({ userId }: { userId: number }) {
  const { t } = useTranslation('settings')
  const dispatch = useAppDispatch()
  const folder = useBackupFolder(userId)
  const [busy, setBusy] = useState(false)

  if (folder === undefined) return null
  async function change(action: ReturnType<typeof chooseBackupFolder>) {
    setBusy(true)
    try {
      await dispatch(action)
    } finally {
      setBusy(false)
    }
  }

  if (!folder) {
    return (
      <ListRowButton
        start={<BackupFolderIcon />}
        title={t('chooseBackupFolder')}
        disabled={busy}
        onClick={() => void change(chooseBackupFolder())}
      >
        {t('dailyFolderBackups')}
      </ListRowButton>
    )
  }

  const items: MenuItem[] = []
  if (folder.problem === 'access') {
    items.push({
      id: 'resume',
      label: t('resumeFolderBackups'),
      onSelect: () => void change(resumeBackupFolder(folder.directory)),
    })
  }
  items.push(
    {
      id: 'folder',
      label: t('changeBackupFolder'),
      onSelect: () => void change(chooseBackupFolder()),
    },
    {
      id: 'disable',
      label: t('disableFolderBackups'),
      onSelect: () => void change(disableFolderBackups()),
    }
  )

  const detail =
    folder.lastSavedAt === null
      ? folder.directory.name
      : `${folder.directory.name} · ${formatDate(folder.lastSavedAt, 'd MMM, HH:mm')}`

  return (
    <Menu
      label={t('backupOptions')}
      disabled={busy}
      items={items}
      trigger={
        <ListRowButton
          start={
            folder.problem ? (
              <WarningIcon className="text-ui-warning" />
            ) : (
              <BackupFolderIcon />
            )
          }
          description={detail}
        >
          {t(
            folder.problem
              ? backupProblemKey(folder.problem)
              : 'dailyFolderBackups'
          )}
        </ListRowButton>
      }
    />
  )
}
