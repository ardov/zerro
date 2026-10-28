import { useId, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'
import { defineScreen, useAsk } from '@/6-shared/overlays'
import { DrawerSurface } from '@/6-shared/ui/kit/Drawer'
import { useBottomSheetLayout } from '@/6-shared/ui/kit/useBottomSheetLayout'
import { ListRow } from '@/6-shared/ui/kit/ListRow'
import { Divider } from '@/6-shared/ui/kit/Divider'
import { Collapse } from '@/6-shared/ui/kit/Collapse'
import { useMobileLayout } from '@/6-shared/ui/layout/useMobileLayout'
import { SwitchField } from '@/6-shared/ui/kit/Switch'
import { Confirm } from '@/6-shared/ui/kit/Confirm'
import { toast } from '@/6-shared/ui/kit/Toast'
import { TextSwap } from '@/6-shared/ui/kit/TextSwap'
import { cn } from '@/6-shared/ui/shadcn/utils'
import {
  AutoAwesomeIcon,
  HistoryIcon,
  SaveAltIcon,
  SyncIcon,
  ChevronRightIcon,
  WbSunnyIcon,
  NightsStayIcon,
  AccountBalanceWalletIcon,
  WhatshotIcon,
  HelpOutlineIcon,
  FavoriteBorderIcon,
  ExitToAppIcon,
} from '@/6-shared/ui/Icons'
import { clearFaviconCache } from '@/6-shared/favicon-cache'
import { track } from '@/6-shared/analytics'
import { Button, IconButton } from '@/6-shared/ui/kit/Button'
import { historyPanelScreen } from '@/3-widgets/History/HistoryPanel'
import { ImportBackupItem } from '@/4-features/import/ImportBackupItem'
import { exportCSV } from '@/4-features/export/exportCSV'
import { exportJSON } from '@/4-features/export/exportJSON'
import { convertZmBudgetsToZerro } from '@/4-features/budget/convertZmBudgetsToZerro'
import { logOut } from '@/4-features/authorization'
import { useReloadData, useSettingsTheme } from './settingsActions'
import { SettingsVersion } from './SettingsVersion'

export const settingsScreen = defineScreen<true>('settings')

export function SettingsScreen() {
  const { t } = useTranslation('settings')
  const [open, setOpen] = settingsScreen.use()
  const bottomSheet = useBottomSheetLayout()
  return (
    <DrawerSurface
      title={t('settings')}
      side={bottomSheet ? 'bottom' : 'left'}
      controller={{ open: !!open, setOpen: next => !next && setOpen(null) }}
      contentClassName="flex min-h-full flex-col px-2 pt-2 pb-3"
    >
      <SettingsContent onClose={() => setOpen(null)} />
    </DrawerSurface>
  )
}

function SettingsContent(props: { onClose: () => void }) {
  const { onClose } = props
  const { t } = useTranslation('settings')
  const dispatch = useAppDispatch()
  const reload = useReloadData()
  const openHistory = historyPanelScreen.useOpen()
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const advancedId = useId()
  return (
    <>
      <div>
        <NavigationLinks />
        <Divider className="mx-4 my-2 w-auto" />
        <SettingsAction
          icon={<HistoryIcon />}
          label={t('history:panelTitle')}
          onClick={() => openHistory(true)}
        />
        <ExportBackup />
        <ListRow
          render={
            <button
              type="button"
              aria-expanded={advancedOpen}
              aria-controls={advancedId}
              onClick={() => setAdvancedOpen(open => !open)}
            />
          }
          start={
            <ChevronRightIcon
              className={cn(
                'transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none',
                advancedOpen ? 'rotate-90' : 'rotate-0'
              )}
            />
          }
          className="cursor-pointer focusable hover:after:opacity-100"
        >
          {t('advancedSettings')}
        </ListRow>
        <div id={advancedId}>
          <Collapse open={advancedOpen}>
            <div className="py-2">
              <SettingsAction
                icon={<SaveAltIcon />}
                label={t('downloadCSV')}
                onClick={() => {
                  track('data_export_requested', { format: 'csv' })
                  dispatch(exportCSV)
                }}
              />
              <ImportBackupItem />
              <SettingsAction
                icon={<SyncIcon />}
                label={t('reloadData')}
                onClick={reload}
              />
              <ClearIconCache />
              <div className="pt-4">
                <BudgetSettings />
              </div>
            </div>
          </Collapse>
        </div>
      </div>
      <SettingsFooter onClose={onClose} />
    </>
  )
}

function NavigationLinks() {
  const { t } = useTranslation('navigation')
  const mobile = useMobileLayout()
  const destinations = [
    ...(mobile
      ? [
          {
            to: '/accounts',
            label: t('accounts'),
            icon: <AccountBalanceWalletIcon />,
          },
        ]
      : []),
    { to: '/review', label: t('yearWrapped'), icon: <WhatshotIcon /> },
    ...(mobile
      ? [{ to: '/about', label: t('about'), icon: <HelpOutlineIcon /> }]
      : []),
    { to: '/donation', label: t('donate'), icon: <FavoriteBorderIcon /> },
  ]
  return destinations.map(({ to, label, icon }) => (
    <ListRow
      key={to}
      render={<Link to={to} />}
      start={icon}
      className="cursor-pointer focusable hover:after:opacity-100 no-underline"
    >
      {label}
    </ListRow>
  ))
}

function SettingsFooter(props: { onClose: () => void }) {
  const { onClose } = props
  const { t, i18n } = useTranslation('settings')
  const dispatch = useAppDispatch()
  const theme = useSettingsTheme()
  const [currency, setCurrency] = core.currency.useDisplayCurrency()
  const [initialCurrency] = useState(currency)
  const accounts = core.accounts.usePopulated()
  const currencies = Array.from(
    new Set([
      initialCurrency,
      currency,
      ...Object.values(accounts)
        .filter(
          account =>
            account.type !== 'debt' &&
            !core.accounts.isZerroDataAccount(account)
        )
        .map(account => account.fxCode),
    ])
  ).sort()
  const russian = (i18n.resolvedLanguage || i18n.language).startsWith('ru')
  const languageLabel = russian ? 'RU' : 'EN'
  return (
    <footer className="mt-auto flex items-center justify-between gap-1 px-2 pt-6">
      <div className="flex shrink-0 items-center">
        <IconButton
          label={t(theme.dark ? 'darkMode' : 'lightMode')}
          variant="ghost"
          muted
          size="sm"
          onClick={theme.toggle}
        >
          {theme.dark ? <NightsStayIcon /> : <WbSunnyIcon />}
        </IconButton>
        <Button
          aria-label={`${t('language')}: ${languageLabel}`}
          variant="ghost"
          muted
          size="sm"
          onClick={() => {
            void i18n.changeLanguage(russian ? 'en' : 'ru')
            track('setting_changed', { setting: 'language', value: 'changed' })
          }}
        >
          <TextSwap value={languageLabel} />
        </Button>
        <Button
          aria-label={`${t('displayCurrency')}: ${currency}`}
          variant="ghost"
          muted
          size="sm"
          className="tabular-nums"
          onClick={() =>
            setCurrency(
              currencies[(currencies.indexOf(currency) + 1) % currencies.length]
            )
          }
        >
          <TextSwap value={currency} />
        </Button>
      </div>
      <div className="flex min-w-0 items-center gap-1">
        <SettingsVersion />
        <IconButton
          label={t('logOut')}
          variant="ghost"
          muted
          size="sm"
          onClick={() => {
            onClose()
            track('logout', { source: 'settings_menu' })
            dispatch(logOut())
          }}
        >
          <ExitToAppIcon />
        </IconButton>
      </div>
    </footer>
  )
}

function SettingsAction(props: {
  label: string
  icon?: ReactNode
  disabled?: boolean
  onClick: () => void
}) {
  const { label, icon, disabled, onClick } = props
  return (
    <ListRow
      render={<button type="button" disabled={disabled} onClick={onClick} />}
      start={icon}
      className="cursor-pointer focusable hover:after:opacity-100 disabled:pointer-events-none"
    >
      {label}
    </ListRow>
  )
}

function BudgetSettings() {
  const { t } = useTranslation('settings')
  const titleId = useId()
  const dispatch = useAppDispatch()
  const { preferZmBudgets } = core.settings.use()
  return (
    <section aria-labelledby={titleId}>
      <h3
        id={titleId}
        className="m-0 px-4 py-2 text-ui-14 font-medium text-ui-secondary"
      >
        {t('budgets')}
      </h3>
      <SwitchField
        aria-label={t('useZmBudgets')}
        className="px-4 [&>[role=switch]]:order-last [&>[role=switch]]:ml-auto [&>span:last-child]:flex-1"
        label={
          <>
            <span className="block">{t('useZmBudgets')}</span>
            <span className="block text-ui-14 text-ui-secondary">
              {t('useZmBudgetsDescription')}
            </span>
          </>
        }
        checked={preferZmBudgets}
        onCheckedChange={next => {
          dispatch(core.settings.setPreferZmBudgets(next))
          track('setting_changed', {
            setting: 'prefer_zenmoney_budgets',
            value: next,
          })
        }}
      />
      {!preferZmBudgets && (
        <SettingsAction
          icon={<AutoAwesomeIcon />}
          label={t('convertBudgetsFromZm')}
          onClick={() => {
            const updated = dispatch(convertZmBudgetsToZerro())
            track('legacy_budgets_converted', {})
            toast.add({
              type: 'success',
              title: t('budgetsConverted', { budgets: updated.length }),
            })
          }}
        />
      )}
    </section>
  )
}

function ExportBackup() {
  const { t } = useTranslation('settings')
  const dispatch = useAppDispatch()
  const pending = useAppSelector(state => state.data.outbox.length > 0)
  const ask = useAsk()
  const download = async () => {
    if (
      pending &&
      !(await ask(
        <Confirm
          title={t('exportPendingTitle')}
          description={t('exportPendingWarning')}
          cancelText={t('exportPendingCancel')}
          okText={t('exportPendingConfirm')}
        />
      ))
    )
      return
    track('data_export_requested', { format: 'json' })
    dispatch(exportJSON)
  }
  return (
    <SettingsAction
      icon={<SaveAltIcon />}
      label={t('fullBackup')}
      onClick={() => void download()}
    />
  )
}

function ClearIconCache() {
  const { t } = useTranslation('settings')
  const [clearing, setClearing] = useState(false)
  const clear = async () => {
    setClearing(true)
    try {
      await clearFaviconCache()
      toast.add({ type: 'success', title: t('iconCacheCleared') })
    } catch {
      toast.add({ type: 'error', title: t('iconCacheClearFailed') })
    } finally {
      setClearing(false)
    }
  }
  return (
    <SettingsAction
      icon={<SyncIcon />}
      label={t('clearIconCache')}
      disabled={clearing}
      onClick={() => void clear()}
    />
  )
}
