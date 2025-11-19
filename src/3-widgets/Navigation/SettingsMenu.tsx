import React, { FC, useCallback, useState } from 'react'
import { Link, useHistory } from 'react-router-dom'
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
  TagIcon,
} from '6-shared/ui/Icons'
import {
  Divider,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  ListSubheader,
  MenuItem,
  MenuList,
  PopoverProps,
  Switch,
  Typography,
} from '@mui/material'
import { sendEvent } from '6-shared/helpers/tracking'
import { useSnackbar } from '6-shared/ui/SnackbarProvider'
import { AdaptivePopover } from '6-shared/ui/AdaptivePopover'
import { appVersion } from '6-shared/config'

import { useAppDispatch } from 'store'
import { resetData } from 'store/data'

import { userSettingsModel } from '5-entities/userSettings'
import { useRegularSync } from '3-widgets/RegularSyncHandler'
import { logOut } from '4-features/authorization'
import { exportCSV } from '4-features/export/exportCSV'
import { exportJSON } from '4-features/export/exportJSON'
import { clearLocalData } from '4-features/localData'
import { convertZmBudgetsToZerro } from '4-features/budget/convertZmBudgetsToZerro'
import { registerPopover } from '6-shared/historyPopovers'
import { useConfirm } from '6-shared/ui/SmartConfirm'
import { useColorScheme } from '6-shared/ui/theme'

const settingsHooks = registerPopover<{}, PopoverProps>('settingsMenu', {})

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
  const { displayProps } = settingsHooks.useProps()
  return (
    <AdaptivePopover {...displayProps}>
      <MenuList>
        <Settings showLinks={showLinks} onClose={displayProps.onClose} />
      </MenuList>
    </AdaptivePopover>
  )
}

const Settings = (props: { onClose: () => void; showLinks?: boolean }) => {
  const { t } = useTranslation('settings')
  const [isExpanded, setExpanded] = useState(false)
  return (
    <>
      {props.showLinks && <NavItems onClose={props.onClose} />}
      <ListSubheader>{t('settings')}</ListSubheader>
      <ThemeItem onClose={props.onClose} />
      <ReloadDataItem onClose={props.onClose} />
      <AutoSyncItem />
      {isExpanded ? (
        <>
          <IconModeItem />
          <BudgetSettingsItem />
        </>
      ) : (
        <MenuItem onClick={() => setExpanded(true)}>
          <ListItemIcon>
            <MoreHorizIcon />
          </ListItemIcon>
          <ListItemText>{t('advancedSettings')}</ListItemText>
        </MenuItem>
      )}
      <Divider sx={{ opacity: '0.6' }} />
      <ListSubheader>{t('export')}</ListSubheader>
      <ExportCsvItem />
      <ExportJsonItem />
      <Divider sx={{ opacity: '0.6' }} />
      <LangItem onClose={props.onClose} />
      <LogOutItem onClose={props.onClose} />
      <VersionItem onClose={props.onClose} />
    </>
  )
}

type ItemProps = { onClose: () => void }

function ExportCsvItem() {
  const { t } = useTranslation('settings')
  const dispatch = useAppDispatch()
  const handleExportCSV = () => {
    sendEvent('Settings: export csv')
    dispatch(exportCSV)
  }
  return (
    <MenuItem onClick={handleExportCSV}>
      <ListItemIcon>
        <SaveAltIcon />
      </ListItemIcon>
      <ListItemText>{t('downloadCSV')}</ListItemText>
    </MenuItem>
  )
}

function ExportJsonItem() {
  const { t } = useTranslation('settings')
  const dispatch = useAppDispatch()
  const handleExportCSV = () => {
    sendEvent('Settings: export json')
    dispatch(exportJSON)
  }
  return (
    <MenuItem onClick={handleExportCSV}>
      <ListItemIcon>
        <SaveAltIcon />
      </ListItemIcon>
      <ListItemText>{t('fullBackup')}</ListItemText>
    </MenuItem>
  )
}

function ThemeItem({ onClose }: ItemProps) {
  const { t } = useTranslation('settings')
  const theme = useColorScheme()
  const handleThemeChange = () => {
    sendEvent('Settings: toggle theme')
    onClose()
    theme.toggle()
  }
  return (
    <MenuItem onClick={handleThemeChange}>
      <ListItemIcon>
        {theme.mode === 'dark' ? <WbSunnyIcon /> : <NightsStayIcon />}
      </ListItemIcon>
      <ListItemText>
        {t(theme.mode === 'dark' ? 'lightMode' : 'darkMode')}
      </ListItemText>
    </MenuItem>
  )
}

function LangItem({ onClose }: ItemProps) {
  const { t, i18n } = useTranslation('settings')
  const currentLang = i18n.resolvedLanguage || i18n.language

  const setNextLang = () => {
    const nextLang = currentLang === 'en' ? 'ru' : 'en'
    sendEvent(`Settings: change language to ${nextLang}`)
    i18n.changeLanguage(nextLang)
  }

  return (
    <MenuItem onClick={setNextLang}>
      <ListItemIcon>
        <GlobeIcon />
      </ListItemIcon>
      <ListItemText>{t('language')}</ListItemText>
      <ListItemSecondaryAction>
        {currentLang.toUpperCase()}
      </ListItemSecondaryAction>
    </MenuItem>
  )
}

function NavItems({ onClose }: ItemProps) {
  const { t } = useTranslation('navigation')
  const history = useHistory()
  const handleNav =
    (path: string): React.MouseEventHandler<HTMLAnchorElement> =>
    e => {
      e.preventDefault()
      onClose()
      setTimeout(() => history.push(path), 10)
    }
  return (
    <>
      <MenuItem onClick={handleNav('/accounts')} component={Link} to="/stats">
        <ListItemIcon>
          <AccountBalanceWalletIcon />
        </ListItemIcon>
        <ListItemText>{t('accounts')}</ListItemText>
      </MenuItem>
      <MenuItem onClick={handleNav('/review')} component={Link} to="/review">
        <ListItemIcon>
          <WhatshotIcon />
        </ListItemIcon>
        <ListItemText>{t('yearWrapped')}</ListItemText>
      </MenuItem>
      <MenuItem onClick={handleNav('/about')} component={Link} to="/about">
        <ListItemIcon>
          <HelpOutlineIcon />
        </ListItemIcon>
        <ListItemText>{t('about')}</ListItemText>
      </MenuItem>
      <MenuItem
        onClick={handleNav('/donation')}
        component={Link}
        to="/donation"
      >
        <ListItemIcon>
          <FavoriteBorderIcon />
        </ListItemIcon>
        <ListItemText>{t('donate')}</ListItemText>
      </MenuItem>
      <Divider sx={{ opacity: '0.6' }} />
    </>
  )
}

function ReloadDataItem({ onClose }: ItemProps) {
  const { t } = useTranslation('settings')
  const dispatch = useAppDispatch()
  const reloadData = () => {
    sendEvent('Settings: reload data')
    dispatch(resetData())
    dispatch(clearLocalData())
    window.location.reload()
  }
  const reload = useConfirm({ onOk: reloadData })
  return (
    <MenuItem onClick={reload}>
      <ListItemIcon>
        <SyncIcon />
      </ListItemIcon>
      <ListItemText>{t('reloadData')}</ListItemText>
    </MenuItem>
  )
}

function AutoSyncItem() {
  const { t } = useTranslation('settings')
  const [regular, setRegular] = useRegularSync()
  const handleClick = () => {
    sendEvent(`Settings: turn sync ${regular ? 'off' : 'on'}`)
    setRegular(c => !c)
  }
  return (
    <MenuItem onClick={handleClick}>
      <ListItemIcon>
        {regular ? <SyncIcon /> : <SyncDisabledIcon />}
      </ListItemIcon>
      <ListItemText>{t('regularSync')}</ListItemText>
      <Switch edge="end" checked={regular} />
    </MenuItem>
  )
}

function IconModeItem() {
  const { t } = useTranslation('settings')
  const dispatch = useAppDispatch()
  const { emojiIcons } = userSettingsModel.useUserSettings()
  const handleClick = () => {
    const next = !emojiIcons
    sendEvent(`Settings: emoji icons set to ${next}`)
    dispatch(userSettingsModel.patch({ emojiIcons: next }))
  }
  return (
    <MenuItem onClick={handleClick}>
      <ListItemIcon>
        <TagIcon />
      </ListItemIcon>
      <ListItemText>{t(emojiIcons ? 'useIcons' : 'useEmojis')}</ListItemText>
    </MenuItem>
  )
}

function BudgetSettingsItem() {
  const { t } = useTranslation('settings')
  const dispatch = useAppDispatch()
  const setSnackbar = useSnackbar()
  const { preferZmBudgets } = userSettingsModel.useUserSettings()
  const toggleSetting = () => {
    sendEvent(`Settings: preferZmBudgets ${preferZmBudgets ? 'off' : 'on'}`)
    dispatch(userSettingsModel.patch({ preferZmBudgets: !preferZmBudgets }))
  }
  const convertBudgets = () => {
    sendEvent(`Settings: convert old budgets`)
    const updated = dispatch(convertZmBudgetsToZerro())
    setSnackbar({
      message: t('budgetsConverted', {
        budgets: updated.length,
      }),
    })
  }

  return (
    <>
      <MenuItem onClick={toggleSetting}>
        <ListItemIcon>
          <AutoAwesomeIcon />
        </ListItemIcon>
        <ListItemText
          sx={{ whiteSpace: 'normal' }}
          primary={t('useZmBudgets')}
          secondary={t('useZmBudgetsDescription')}
        />
        <Switch edge="end" checked={!!preferZmBudgets} />
      </MenuItem>

      {!preferZmBudgets && (
        <MenuItem onClick={convertBudgets}>
          <ListItemIcon>
            <AutoAwesomeIcon />
          </ListItemIcon>
          <ListItemText
            sx={{ whiteSpace: 'normal' }}
            primary={t('convertBudgetsFromZm')}
          />
        </MenuItem>
      )}
    </>
  )
}

function LogOutItem({ onClose }: ItemProps) {
  const { t } = useTranslation('settings')
  const dispatch = useAppDispatch()
  const handleClick = () => {
    onClose()
    sendEvent('Settings: log out')
    dispatch(logOut())
  }
  return (
    <MenuItem onClick={handleClick}>
      <ListItemIcon>
        <ExitToAppIcon />
      </ListItemIcon>
      <ListItemText>{t('logOut')}</ListItemText>
    </MenuItem>
  )
}

function VersionItem({ onClose }: ItemProps) {
  const { t } = useTranslation('settings')
  return (
    <MenuItem
      onClick={() => {
        onClose()
        window.location.reload()
      }}
    >
      <ListItemIcon />
      <ListItemText>
        <Typography variant="overline" sx={{ color: 'text.secondary' }}>
          {t('version', { version: appVersion })}
        </Typography>
      </ListItemText>
    </MenuItem>
  )
}
