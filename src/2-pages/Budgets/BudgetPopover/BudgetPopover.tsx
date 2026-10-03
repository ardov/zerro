import type { TFxAmount, TISOMonth } from '@/6-shared/types'
import { core } from '@/zerro-core/redux'

import type { FC } from 'react'
import { useRef, useState } from 'react'
import { IconButton } from '@/6-shared/ui/kit/Button'
import {
  ActionList,
  ActionListItem,
  type ActionListHandle,
} from '@/6-shared/ui/kit/ActionList'
import { isPlainKey } from '@/6-shared/helpers/keyboard'
import { useBottomSheetLayout } from '@/6-shared/ui/kit/useBottomSheetLayout'
import { FieldAddon } from '@/6-shared/ui/kit/Field'
import { useTranslation } from 'react-i18next'
import { ArrowForwardIcon } from '@/6-shared/ui/Icons'
import { AmountInput } from '@/6-shared/ui/kit/AmountInput'
import { formatMoney } from '@/6-shared/helpers/money'
import { track } from '@/6-shared/analytics'
import { PopoverSurface } from '@/6-shared/ui/kit/Popover'

import { useAppDispatch, useAppSelector } from '@/store'
import { setTotalBudget } from '@/4-features/budget/setTotalBudget'
import { useQuickActions } from './useQuickActions'
import { useAmountAlignment } from './useAmountAlignment'

export type TBudgetPopoverProps = {
  open: boolean
  anchor?: Element | null
  /** Table amount line box; align the editable value over it on desktop. */
  alignAmount?: boolean
  onClose: () => void
  id: core.envelopes.TEnvelopeId
  month: TISOMonth
}

export const BudgetPopover: FC<TBudgetPopoverProps> = props => {
  const { id, month, onClose, open, anchor, alignAmount } = props
  const { t } = useTranslation()
  const quickAmountsRef = useRef<ActionListHandle>(null)
  const narrow = useBottomSheetLayout()
  const { inputRef, positioning, controlClassName } = useAmountAlignment(
    Boolean(alignAmount && !narrow)
  )
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
    <PopoverSurface
      controller={{
        open,
        setOpen: next => {
          if (!next) changeAndClose(inputValue)
        },
      }}
      anchor={anchor}
      {...positioning}
      label={envelopeName || t('budget')}
      contentClassName="p-1"
    >
      <AmountInput
        ref={inputRef}
        autoFocus
        controlClassName={controlClassName}
        operators={narrow}
        value={inputValue}
        onChange={value => setInputValue(+value)}
        onEnter={value => changeAndClose(+value)}
        onKeyDown={event => {
          if (event.key === 'ArrowDown' && isPlainKey(event)) {
            event.preventDefault()
            quickAmountsRef.current?.focus()
          }
        }}
        description={helperText}
        placeholder="0"
        label={t('assigned')}
        start={<FieldAddon>{currency.env}</FieldAddon>}
        end={
          <FieldAddon kind="action">
            <IconButton
              size="sm"
              tooltip={false}
              variant="ghost"
              label={t('apply')}
              onClick={() => changeAndClose(+inputValue)}
            >
              <ArrowForwardIcon />
            </IconButton>
          </FieldAddon>
        }
      >
        <ActionList
          ref={quickAmountsRef}
          onNavigateBefore={() => inputRef.current?.focus()}
          aria-label={t('quickAmounts')}
          className="mt-2"
        >
          {quickActions.map(({ text, amount }, index) => (
            <ActionListItem
              selected={inputValue === amount}
              end={format.env(amount)}
              key={text}
              onClick={() => {
                changeAndClose(amount)
                track('budget_quick_amount_selected', {
                  preset_position: index + 1,
                })
              }}
            >
              {text}
            </ActionListItem>
          ))}
        </ActionList>
      </AmountInput>
    </PopoverSurface>
  )
}
