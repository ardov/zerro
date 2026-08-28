import type { FC } from 'react'
import React, { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  SaveAltIcon,
  ExitToAppIcon,
  WhatshotIcon,
  WbSunnyIcon,
  NightsStayIcon,
  FavoriteBorderIcon,
  HelpOutlineIcon,
  SyncIcon,
  SyncDisabledIcon,
  AutoAwesomeIcon,
  MoreHorizIcon,
  AccountBalanceWalletIcon,
  GlobeIcon,
  HistoryIcon,
  TagIcon,
} from '6-shared/ui/Icons'
import Switch from '@mui/material/Switch'
import { ActionList, ActionListItem } from '6-shared/ui/ActionList'
import {
  ListRowAction,
  ListRowDivider,
  ListRowIcon,
  ListRowSubheader,
  ListRowText,
} from '6-shared/ui/ListRow'
import { track } from '6-shared/analytics'
import { useSnackbar } from '6-shared/ui/SnackbarProvider'
import {
  AdaptivePopover,
  type AdaptivePopoverProps,
} from '6-shared/ui/AdaptivePopover'
import { appVersion } from '6-shared/config'

import { useAppDispatch, useAppSelector } from 'store'

import { core } from 'zerro-core/redux'

import { useRegularSync } from '3-widgets/RegularSyncHandler'
import { useHistoryPanelFromMenu } from '3-widgets/History/HistoryPanel'
import { logOut } from '4-features/authorization'
import { exportCSV } from '4-features/export/exportCSV'
import { exportJSON } from '4-features/export/exportJSON'
import { ImportBackupItem } from '4-features/import/ImportBackupItem'
import { reloadData } from '4-features/sync'
import { convertZmBudgetsToZerro } from '4-features/budget/convertZmBudgetsToZerro'
import { registerPopover } from '6-shared/historyPopovers'
import { useConfirm } from '6-shared/ui/SmartConfirm'
import { useColorScheme } from '6-shared/ui/theme'

const settingsHooks = registerPopover<object, AdaptivePopoverProps>(
  'settingsMenu',
  {}
)

export const useSettingsMenu = () => {
  const { open } = settingsHooks.useMethods()
  return useCallback(
    (e: React.MouseEvent) => {
      open({}, { anchorEl: e.currentTarget })
    },
    [open]
  )
}

type SettingsMenuProps = { showLinks?: boolean }

export const SettingsMenu: FC<SettingsMenuProps> = props => {
  const { showLinks } = props
  const { t } = useTranslation('settings')
  const { displayProps } = settingsHooks.useProps()
  return (
    <AdaptivePopover {...displayProps} aria-label={t('settings')}>
      <ActionList aria-label={t('settings')}>
        <Settings showLinks={showLinks} onClose={displayProps.onClose} />
      </ActionList>
    </AdaptivePopover>
  )
}

const Settings = (props: { onClose: () => void; showLinks?: boolean }) => {
  const { t } = useTranslation('settings')
  const [isExpanded, setExpanded] = useState(false)
  return (
    <>
      {props.showLinks && <NavItems onClose={props.onClose} />}
      <ListRowSubheader>{t('settings')}</ListRowSubheader>
      <ThemeItem onClose={props.onClose} />
      <ReloadDataItem onClose={props.onClose} />
      <AutoSyncItem />
      {isExpanded ? (
        <>
          <IconModeItem />
          <BudgetSettingsItem />
        </>
      ) : (
        <ActionListItem onClick={() => setExpanded(true)}>
          <ListRowIcon>
            <MoreHorizIcon />
          </ListRowIcon>
          <ListRowText>{t('advancedSettings')}</ListRowText>
        </ActionListItem>
      )}
      <ListRowDivider className="opacity-60" />
      <ListRowSubheader>{t('data')}</ListRowSubheader>
      <HistoryItem onClose={props.onClose} />
      <ExportCsvItem />
      <ExportJsonItem />
      <ImportBackupItem />
      <ListRowDivider className="opacity-60" />
      <LangItem onClose={props.onClose} />
      <LogOutItem onClose={props.onClose} />
      <VersionItem onClose={props.onClose} />
    </>
  )
}

/** The switch in this menu has never been operable on its own: it carries no
 * `onChange`, and the row's `onClick` is what toggles the setting. Now that the
 * row is a real button, the input is made inert so it cannot be focused or
 * clicked inside one, and `aria-pressed` on the row carries the state that the
 * stray checkbox used to announce separately. It stays MUI until a switch is
 * needed somewhere that justifies owning one. */
const DecorativeSwitch = ({ checked }: { checked: boolean }) => (
  <Switch
    edge="end"
    checked={checked}
    readOnly
    tabIndex={-1}
    aria-hidden
    className="pointer-events-none"
  />
)

type ItemProps = { onClose: () => void }

/**
 * The entry to change history. The panel takes this menu's place on the
 * popover stack rather than stacking on top of it, so closing the panel
 * returns to the page instead of reopening the menu behind it.
 */
function HistoryItem(_props: ItemProps) {
  const { t } = useTranslation('history')
  const openPanel = useHistoryPanelFromMenu()
  return (
    <ActionListItem onClick={openPanel}>
      <ListRowIcon>
        <HistoryIcon />
      </ListRowIcon>
      <ListRowText>{t('panelTitle')}</ListRowText>
    </ActionListItem>
  )
}

function ExportCsvItem() {
  const { t } = useTranslation('settings')
  const dispatch = useAppDispatch()
  const handleExportCSV = () => {
    track('data_export_requested', { format: 'csv' })
    dispatch(exportCSV)
  }
  return (
    <ActionListItem onClick={handleExportCSV}>
      <ListRowIcon>
        <SaveAltIcon />
      </ListRowIcon>
      <ListRowText>{t('downloadCSV')}</ListRowText>
    </ActionListItem>
  )
}

function ExportJsonItem() {
  const { t } = useTranslation('settings')
  const dispatch = useAppDispatch()
  const hasPendingOutbox = useAppSelector(state => state.data.outbox.length > 0)
  const downloadBackup = () => {
    track('data_export_requested', { format: 'json' })
    dispatch(exportJSON)
  }
  const confirmExport = useConfirm({
    title: t('exportPendingTitle'),
    description: t('exportPendingWarning'),
    cancelText: t('exportPendingCancel'),
    okText: t('exportPendingConfirm'),
    onOk: downloadBackup,
  })
  const handleExportJson = () => {
    if (hasPendingOutbox) confirmExport()
    else downloadBackup()
  }
  return (
    <ActionListItem onClick={handleExportJson}>
      <ListRowIcon>
        <SaveAltIcon />
      </ListRowIcon>
      <ListRowText>{t('fullBackup')}</ListRowText>
    </ActionListItem>
  )
}

function ThemeItem({ onClose }: ItemProps) {
  const { t } = useTranslation('settings')
  const theme = useColorScheme()
  const handleThemeChange = () => {
    onClose()
    theme.toggle()
    track('setting_changed', { setting: 'theme', value: 'changed' })
  }
  return (
    <ActionListItem onClick={handleThemeChange}>
      <ListRowIcon>
        {theme.mode === 'dark' ? <WbSunnyIcon /> : <NightsStayIcon />}
      </ListRowIcon>
      <ListRowText>
        {t(theme.mode === 'dark' ? 'lightMode' : 'darkMode')}
      </ListRowText>
    </ActionListItem>
  )
}

function LangItem(_props: ItemProps) {
  const { t, i18n } = useTranslation('settings')
  const currentLang = i18n.resolvedLanguage || i18n.language

  const setNextLang = () => {
    const nextLang = currentLang === 'en' ? 'ru' : 'en'
    i18n.changeLanguage(nextLang)
    track('setting_changed', { setting: 'language', value: 'changed' })
  }

  return (
    <ActionListItem onClick={setNextLang}>
      <ListRowIcon>
        <GlobeIcon />
      </ListRowIcon>
      <ListRowText>{t('language')}</ListRowText>
      <ListRowAction>{currentLang.toUpperCase()}</ListRowAction>
    </ActionListItem>
  )
}

function NavItems({ onClose }: ItemProps) {
  const { t } = useTranslation('navigation')
  const navigate = useNavigate()
  const handleNav =
    (path: string): React.MouseEventHandler<HTMLElement> =>
    e => {
      e.preventDefault()
      onClose()
      setTimeout(() => navigate(path), 10)
    }
  return (
    <>
      <ActionListItem
        onClick={handleNav('/accounts')}
        render={<Link to="/accounts" />}
        nativeButton={false}
      >
        <ListRowIcon>
          <AccountBalanceWalletIcon />
        </ListRowIcon>
        <ListRowText>{t('accounts')}</ListRowText>
      </ActionListItem>
      <ActionListItem
        onClick={handleNav('/review')}
        render={<Link to="/review" />}
        nativeButton={false}
      >
        <ListRowIcon>
          <WhatshotIcon />
        </ListRowIcon>
        <ListRowText>{t('yearWrapped')}</ListRowText>
      </ActionListItem>
      <ActionListItem
        onClick={handleNav('/about')}
        render={<Link to="/about" />}
        nativeButton={false}
      >
        <ListRowIcon>
          <HelpOutlineIcon />
        </ListRowIcon>
        <ListRowText>{t('about')}</ListRowText>
      </ActionListItem>
      <ActionListItem
        onClick={handleNav('/donation')}
        render={<Link to="/donation" />}
        nativeButton={false}
      >
        <ListRowIcon>
          <FavoriteBorderIcon />
        </ListRowIcon>
        <ListRowText>{t('donate')}</ListRowText>
      </ActionListItem>
      <ListRowDivider className="opacity-60" />
    </>
  )
}

/**
 * The only manual way to add a checkpoint. Checkpoints are otherwise written
 * only by recovery and retention, so this is what a user reaches for when
 * startup replay has grown long or history should get a fresh anchor.
 */
function ReloadDataItem(_props: ItemProps) {
  const { t } = useTranslation('settings')
  const dispatch = useAppDispatch()
  const requestReload = useCallback(() => {
    track('local_data_reload_requested', {})
    void dispatch(reloadData())
  }, [dispatch])
  const reload = useConfirm({
    title: t('reloadData'),
    description: t('reloadDataDescription'),
    okText: t('reloadData'),
    onOk: requestReload,
  })
  return (
    <ActionListItem onClick={reload}>
      <ListRowIcon>
        <SyncIcon />
      </ListRowIcon>
      <ListRowText>{t('reloadData')}</ListRowText>
    </ActionListItem>
  )
}

function AutoSyncItem() {
  const { t } = useTranslation('settings')
  const [regular, setRegular] = useRegularSync()
  const handleClick = () => {
    setRegular(c => !c)
    track('setting_changed', { setting: 'auto_sync', value: !regular })
  }
  return (
    <ActionListItem onClick={handleClick} aria-pressed={regular}>
      <ListRowIcon>{regular ? <SyncIcon /> : <SyncDisabledIcon />}</ListRowIcon>
      <ListRowText>{t('regularSync')}</ListRowText>
      <ListRowAction>
        <DecorativeSwitch checked={regular} />
      </ListRowAction>
    </ActionListItem>
  )
}

function IconModeItem() {
  const { t } = useTranslation('settings')
  const dispatch = useAppDispatch()
  const { emojiIcons } = core.settings.use()
  const handleClick = () => {
    const next = !emojiIcons
    dispatch(core.settings.setEmojiIcons(next))
    track('setting_changed', { setting: 'emoji_icons', value: next })
  }
  return (
    <ActionListItem onClick={handleClick}>
      <ListRowIcon>
        <TagIcon />
      </ListRowIcon>
      <ListRowText>{t(emojiIcons ? 'useIcons' : 'useEmojis')}</ListRowText>
    </ActionListItem>
  )
}

function BudgetSettingsItem() {
  const { t } = useTranslation('settings')
  const dispatch = useAppDispatch()
  const setSnackbar = useSnackbar()
  const { preferZmBudgets } = core.settings.use()
  const toggleSetting = () => {
    dispatch(core.settings.setPreferZmBudgets(!preferZmBudgets))
    track('setting_changed', {
      setting: 'prefer_zenmoney_budgets',
      value: !preferZmBudgets,
    })
  }
  const convertBudgets = () => {
    const updated = dispatch(convertZmBudgetsToZerro())
    track('legacy_budgets_converted', {})
    setSnackbar({
      message: t('budgetsConverted', {
        budgets: updated.length,
      }),
    })
  }

  return (
    <>
      <ActionListItem onClick={toggleSetting} aria-pressed={!!preferZmBudgets}>
        <ListRowIcon>
          <AutoAwesomeIcon />
        </ListRowIcon>
        <ListRowText
          className="whitespace-normal"
          secondary={t('useZmBudgetsDescription')}
        >
          {t('useZmBudgets')}
        </ListRowText>
        <ListRowAction>
          <DecorativeSwitch checked={!!preferZmBudgets} />
        </ListRowAction>
      </ActionListItem>

      {!preferZmBudgets && (
        <ActionListItem onClick={convertBudgets}>
          <ListRowIcon>
            <AutoAwesomeIcon />
          </ListRowIcon>
          <ListRowText className="whitespace-normal">
            {t('convertBudgetsFromZm')}
          </ListRowText>
        </ActionListItem>
      )}
    </>
  )
}

function LogOutItem({ onClose }: ItemProps) {
  const { t } = useTranslation('settings')
  const dispatch = useAppDispatch()
  const handleClick = () => {
    onClose()
    track('logout', { source: 'settings_menu' })
    dispatch(logOut())
  }
  return (
    <ActionListItem onClick={handleClick}>
      <ListRowIcon>
        <ExitToAppIcon />
      </ListRowIcon>
      <ListRowText>{t('logOut')}</ListRowText>
    </ActionListItem>
  )
}

function VersionItem({ onClose }: ItemProps) {
  const { t } = useTranslation('settings')
  return (
    <ActionListItem
      onClick={() => {
        onClose()
        window.location.reload()
      }}
    >
      <ListRowIcon />
      <ListRowText>
        <span className="type-overline text-muted-foreground">
          {t('version', { version: appVersion })}
        </span>
      </ListRowText>
    </ActionListItem>
  )
}
