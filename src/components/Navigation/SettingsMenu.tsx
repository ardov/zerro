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
  BarChartIcon,
  SyncIcon,
  SyncDisabledIcon,
  AutoAwesomeIcon,
  MoreHorizIcon,
} from '@shared/ui/Icons'
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
import { useThemeType } from '@shared/hooks/useThemeType'
import { sendEvent } from '@shared/helpers/tracking'
import { Confirm } from '@shared/ui/Confirm'
import { useSnackbar } from '@shared/ui/SnackbarProvider'
import { AdaptivePopover } from '@shared/ui/AdaptivePopover'
import { appVersion } from '@shared/config'

import { useAppDispatch } from '@store'
import { resetData } from '@store/data'

import { userSettingsModel } from '@entities/userSettings'
import { useRegularSync } from '@components/RegularSyncHandler'
import { logOut } from '@features/authorization'
import { exportCSV } from '@features/export/exportCSV'
import { exportJSON } from '@features/export/exportJSON'
import { clearLocalData } from '@features/localData'
import { convertZmBudgetsToZerro } from '@features/budget/convertZmBudgetsToZerro'
import { makePopoverHooks } from '@shared/ui/PopoverManager'

const settingsHooks = makePopoverHooks<{}, PopoverProps>('settingsMenu', {})

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
      <LogOutItem />
      <VersionItem />
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
  const theme = useThemeType()
  const handleThemeChange = () => {
    sendEvent('Settings: toggle theme')
    onClose()
    theme.toggle()
  }
  return (
    <MenuItem onClick={handleThemeChange}>
      <ListItemIcon>
        {theme.type === 'dark' ? <WbSunnyIcon /> : <NightsStayIcon />}
      </ListItemIcon>
      <ListItemText>
        {theme.type === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
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
      <MenuItem onClick={handleNav('/stats')} component={Link} to="/stats">
        <ListItemIcon>
          <BarChartIcon />
        </ListItemIcon>
        <ListItemText>Аналитика</ListItemText>
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
  return (
    <Confirm onOk={reloadData}>
      <MenuItem>
        <ListItemIcon>
          <SyncIcon />
        </ListItemIcon>
        <ListItemText>Перезагрузить данные</ListItemText>
      </MenuItem>
    </Confirm>
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

function LogOutItem() {
  const dispatch = useAppDispatch()
  const handleClick = () => {
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

function VersionItem() {
  return (
    <MenuItem onClick={() => window.location.reload()}>
      <ListItemIcon />
      <ListItemText>
        <Typography
          variant="overline"
          color="textSecondary"
          onClick={() => window.location.reload()}
        >
          Версия: {appVersion}
        </Typography>
      </ListItemText>
    </MenuItem>
  )
}
