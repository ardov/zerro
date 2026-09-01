import type { TFxAmount, TISOMonth } from '@/6-shared/types'
import { core } from '@/zerro-core/redux'

import type { FC, HTMLAttributes } from 'react'
import { useState } from 'react'
import { IconButton } from '@/6-shared/ui/Button'
import { ActionList, ActionListItem } from '@/6-shared/ui/ActionList'
import { useTranslation } from 'react-i18next'
import { ArrowForwardIcon } from '@/6-shared/ui/Icons'
import { AmountInput } from '@/6-shared/ui/AmountInput'
import { formatMoney } from '@/6-shared/helpers/money'
import { track } from '@/6-shared/analytics'
import {
  AdaptivePopover,
  type AdaptivePopoverProps,
} from '@/6-shared/ui/AdaptivePopover'

import { useAppDispatch, useAppSelector } from '@/store'
import { setTotalBudget } from '@/4-features/budget/setTotalBudget'
import { useQuickActions } from './useQuickActions'

export type TBudgetPopoverProps = Omit<AdaptivePopoverProps, 'onClose'> & {
  onClose: () => void
  id: core.envelopes.TEnvelopeId
  month: TISOMonth
}

export const BudgetPopover: FC<TBudgetPopoverProps> = props => {
  const { id, month, onClose, ...rest } = props
  const { t } = useTranslation()
  const quickActions = useQuickActions(month, id)
  const [dispCurrency] = core.currency.useDisplayCurrency()
  const dispatch = useAppDispatch()
  const envelope = useAppSelector(core.activity.selectEnvelopeMetrics)[month][
    id
  ]
  const envelopeName = useAppSelector(core.envelopes.selectAll)[id]?.name
  const convertFx = useAppSelector(core.currency.selectConvertFx)

  const currency = {
    env: envelope.currency, // Envelope currency
    disp: dispCurrency, // Display currency
  }
  /** Functions to convert amounts */
  const convert = {
    toEnv: (a: TFxAmount) => convertFx(a, currency.env, month),
    toDisp: (a: TFxAmount) => convertFx(a, currency.disp, month),
  }
  /** Formatters */
  const format = {
    env: (v: number) => formatMoney(v, currency.env),
    disp: (v: number) => formatMoney(v, currency.disp),
  }
  /** Current assigned */
  const assigned = {
    env: convert.toEnv(envelope.totalAssigned),
    disp: convert.toDisp(envelope.totalAssigned),
  }
  /** Current available */
  const available = {
    env: convert.toEnv(envelope.totalAvailable),
    disp: convert.toDisp(envelope.totalAvailable),
  }

  /** Input value sets in envelope currency */
  const [inputValue, setInputValue] = useState<number>(assigned.env)

  /** Input value converted to envelope and display currencies */
  const value = {
    env: inputValue,
    disp: convert.toDisp({ [currency.env]: inputValue }),
  }
  /** Amount of money that will be available after changes applied */
  const availableAfter = {
    env: value.env - assigned.env + available.env,
    disp: value.disp - assigned.disp + available.disp,
  }

  const [prevAssigned, setPrevAssigned] = useState(assigned.env)
  if (prevAssigned !== assigned.env) {
    setPrevAssigned(assigned.env)
    setInputValue(assigned.env)
  }

  const onChange = (value: number) =>
    dispatch(setTotalBudget({ month, id, value }))

  const changeAndClose = (value: number) => {
    onClose?.()
    if (value !== assigned.env) onChange(value)
  }

  const helperText =
    currency.env !== currency.disp ? (
      <>
        {format.disp(value.disp)}
        <br />
        {t('leftover')} {format.env(availableAfter.env)} (
        {format.disp(availableAfter.disp)})
      </>
    ) : (
      `${t('leftover')} ${format.env(availableAfter.env)}`
    )

  return (
    <AdaptivePopover
      {...rest}
      onClose={() => changeAndClose(+inputValue)}
      drawerSide="top"
      aria-label={envelopeName || t('budget')}
    >
      <div className="p-2">
        <AmountInput
          autoFocus
          value={inputValue}
          fullWidth
          onChange={value => setInputValue(+value)}
          onEnter={value => changeAndClose(+value)}
          helperText={helperText}
          signButtons="auto"
          placeholder="0"
          aria-label={t('assigned')}
          startAdornment={currency.env}
          endAdornment={
            <IconButton
              edge="end"
              aria-label={t('apply')}
              onClick={() => changeAndClose(+inputValue)}
            >
              <ArrowForwardIcon />
            </IconButton>
          }
        />

        <ActionList aria-label={t('quickAmounts')}>
          {quickActions.map(({ text, amount }, index) => (
            <ActionListItem
              key={text}
              selected={inputValue === amount}
              onClick={() => {
                changeAndClose(amount)
                track('budget_quick_amount_selected', {
                  preset_position: index + 1,
                })
              }}
            >
              <NameValueRow name={text} value={format.env(amount)} />
            </ActionListItem>
          ))}
        </ActionList>
      </div>
    </AdaptivePopover>
  )
}

const NameValueRow: FC<
  HTMLAttributes<HTMLDivElement> & { name: string; value: string }
> = ({ name, value, ...rest }) => {
  return (
    <div
      className="flex w-full gap-4 [&>:first-child]:grow [&>:last-child]:text-muted-foreground"
      {...rest}
    >
      <span>{name}</span>
      <span>{value}</span>
    </div>
  )
}
