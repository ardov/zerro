import React, { FC, useCallback, useState } from 'react'
import { Link, useHistory } from 'react-router-dom'
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
} from '6-shared/ui/Icons'
import {
  Divider,
  ListItemIcon,
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
  const [isExpanded, setExpanded] = useState(false)
  return (
    <>
      {props.showLinks && <NavItems onClose={props.onClose} />}

      <ListSubheader>Настройки</ListSubheader>
      <ThemeItem onClose={props.onClose} />
      <ReloadDataItem onClose={props.onClose} />
      <AutoSyncItem />

      {isExpanded ? (
        <BudgetSettingsItem />
      ) : (
        <MenuItem onClick={() => setExpanded(true)}>
          <ListItemIcon>
            <MoreHorizIcon />
          </ListItemIcon>
          <ListItemText>Расширенные настройки...</ListItemText>
        </MenuItem>
      )}

      <Divider light />
      <ListSubheader>Экспорт</ListSubheader>
      <ExportCsvItem />
      <ExportJsonItem />

      <Divider light />
      <LogOutItem onClose={props.onClose} />
      <VersionItem onClose={props.onClose} />
    </>
  )
}

type ItemProps = { onClose: () => void }

function ExportCsvItem() {
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
      <ListItemText>Скачать CSV</ListItemText>
    </MenuItem>
  )
}

function ExportJsonItem() {
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
      <ListItemText>Полный бэкап</ListItemText>
    </MenuItem>
  )
}

function ThemeItem({ onClose }: ItemProps) {
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
        {theme.mode === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
      </ListItemText>
    </MenuItem>
  )
}

function NavItems({ onClose }: ItemProps) {
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
        <ListItemText>Счета</ListItemText>
      </MenuItem>

      <MenuItem onClick={handleNav('/review')} component={Link} to="/review">
        <ListItemIcon>
          <WhatshotIcon />
        </ListItemIcon>
        <ListItemText>Итоги года</ListItemText>
      </MenuItem>

      <MenuItem onClick={handleNav('/about')} component={Link} to="/about">
        <ListItemIcon>
          <HelpOutlineIcon />
        </ListItemIcon>
        <ListItemText>Как пользоваться</ListItemText>
      </MenuItem>

      <MenuItem
        onClick={handleNav('/donation')}
        component={Link}
        to="/donation"
      >
        <ListItemIcon>
          <FavoriteBorderIcon />
        </ListItemIcon>
        <ListItemText>Поддержать проект</ListItemText>
      </MenuItem>

      <Divider light />
    </>
  )
}

function ReloadDataItem({ onClose }: ItemProps) {
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
      <ListItemText>Перезагрузить данные</ListItemText>
    </MenuItem>
  )
}

function AutoSyncItem() {
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
      <ListItemText>Автосинхронизация</ListItemText>
      <Switch edge="end" checked={regular} />
    </MenuItem>
  )
}

function BudgetSettingsItem() {
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
    setSnackbar({ message: `✅ Бюджеты сконвертированы (${updated.length})` })
  }

  return (
    <>
      <MenuItem onClick={toggleSetting}>
        <ListItemIcon>
          <AutoAwesomeIcon />
        </ListItemIcon>
        <ListItemText
          sx={{ whiteSpace: 'normal' }}
          primary={'Бюджеты Дзен-мани'}
          secondary={'Использовать те же бюджеты что и ДМ'}
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
            primary={'Конвертировать бюджеты из Дзен-мани'}
          />
        </MenuItem>
      )}
    </>
  )
}

function LogOutItem({ onClose }: ItemProps) {
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
      <ListItemText>Выйти</ListItemText>
    </MenuItem>
  )
}

function VersionItem({ onClose }: ItemProps) {
  return (
    <MenuItem
      onClick={() => {
        onClose()
        window.location.reload()
      }}
    >
      <ListItemIcon />
      <ListItemText>
        <Typography variant="overline" color="textSecondary">
          Версия: {appVersion}
        </Typography>
      </ListItemText>
    </MenuItem>
  )
}
