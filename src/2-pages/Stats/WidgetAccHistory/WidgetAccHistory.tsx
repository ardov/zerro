import type { FC } from 'react'
import React, { useState, useMemo, useCallback, memo } from 'react'
import { core } from 'zerro-core/redux'

import { useTranslation } from 'react-i18next'
import { Typography, List, ListSubheader, Collapse } from '@mui/material'
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts'
import { useAppTheme } from '6-shared/ui/theme'
import { formatDate, toISOMonth } from '6-shared/helpers/date'
import type { TAccountId, TISODate, TFxAmount } from '6-shared/types'
import { Amount } from '6-shared/ui/Amount'
import { useToggle } from '6-shared/hooks/useToggle'
import { addFxAmount } from '6-shared/helpers/money'
import { DisplayAmount } from '3-widgets/DisplayAmount'
import type { Period } from '../shared/period'
import { useAccountHistory } from './model'
import { useTransactionDrawer } from '3-widgets/global/TransactionListDrawer'

type WidgetAccHistoryProps = {
  period: Period
}

export const WidgetAccHistory: FC<WidgetAccHistoryProps> = memo(
  ({ period }) => {
    const { t } = useTranslation('accounts')
    const toDisplay = core.currency.useToDisplay(toISOMonth(new Date()))
    const trDrawer = useTransactionDrawer()
    const [visible, toggleVisibility] = useToggle()

    const onClick = useCallback(
      (id: TAccountId, date: TISODate) => {
        trDrawer.open({
          initialQuery: { clauses: [{ kind: 'account', ids: [id] }] },
          initialDate: date,
        })
      },
      [trDrawer]
    )

    const inBudgetAccounts = core.accounts.useInBudget()
    const savingAccounts = core.accounts.useSaving()

    const {
      totalInBudget,
      inBudgetActive,
      totalSavings,
      savingsActive,
      totalArchived,
      archived,
    } = useMemo(() => {
      const inBudget = sortAccountsByBalance(inBudgetAccounts, toDisplay)
      const savings = sortAccountsByBalance(savingAccounts, toDisplay)
      const inBudgetArchived = inBudget.filter(a => a.archive)
      const savingsArchived = savings.filter(a => a.archive)
      const archived = sortAccountsByBalance(
        [...inBudgetArchived, ...savingsArchived],
        toDisplay
      )

      return {
        totalInBudget: getTotal(inBudget),
        inBudgetActive: inBudget.filter(a => !a.archive),
        totalSavings: getTotal(savings),
        savingsActive: savings.filter(a => !a.archive),
        totalArchived: getTotal(archived),
        archived,
      }
    }, [inBudgetAccounts, savingAccounts, toDisplay])

    return (
      <div>
        <List dense>
          <Subheader name={t('inBalance')} amount={totalInBudget} />
          {inBudgetActive.map(acc => (
            <AccountHistoryWidget
              key={acc.id}
              id={acc.id}
              period={period}
              onClick={onClick}
            />
          ))}
        </List>

        <List dense>
          <Subheader name={t('other')} amount={totalSavings} />
          {savingsActive.map(acc => (
            <AccountHistoryWidget
              key={acc.id}
              id={acc.id}
              period={period}
              onClick={onClick}
            />
          ))}
        </List>

        <List dense>
          <Subheader
            name={t('archived')}
            amount={totalArchived}
            onClick={toggleVisibility}
          />
          <Collapse in={visible} unmountOnExit>
            <List dense disablePadding>
              {archived.map(acc => (
                <AccountHistoryWidget
                  key={acc.id}
                  id={acc.id}
                  period={period}
                  onClick={onClick}
                />
              ))}
            </List>
          </Collapse>
        </List>
      </div>
    )
  }
)

type SubheaderProps = {
  name: React.ReactNode
  amount: TFxAmount
  onClick?: () => void
}

const Subheader: FC<SubheaderProps> = memo(({ name, amount, onClick }) => {
  const month = toISOMonth(new Date())
  const toDisplay = core.currency.useToDisplay(month)
  const isNegative = toDisplay(amount) < 0

  return (
    <ListSubheader
      className="mb-2 rounded-lg"
      sx={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <span className="flex w-full">
        <Typography component="span" noWrap className="grow leading-[inherit]">
          <b>{name}</b>
        </Typography>

        <span
          className={`${isNegative ? 'text-error' : 'text-muted-foreground'} ml-4`}
        >
          <b>
            <DisplayAmount
              month={month}
              value={amount}
              decimals="ifOnly"
              noShade
            />
          </b>
        </span>
      </span>
    </ListSubheader>
  )
})

type AccTrendProps = {
  period: Period
  id: TAccountId
  onClick: (id: TAccountId, date: TISODate) => void
}

const AccountHistoryWidget: FC<AccTrendProps> = memo(
  ({ id, period, onClick }) => {
    const theme = useAppTheme()
    const acc = core.accounts.usePopulated()[id]
    const data = useAccountHistory(id, period)

    const { dataMax, dataMin, yAxisMin } = useMemo(() => {
      if (data.length === 0) return { dataMax: 0, dataMin: 0, yAxisMin: 0 }

      let max = data[0].balance
      let min = data[0].balance

      for (let i = 1; i < data.length; i++) {
        if (data[i].balance > max) max = data[i].balance
        if (data[i].balance < min) min = data[i].balance
      }

      return { dataMax: max, dataMin: min, yAxisMin: Math.min(0, min) }
    }, [data])

    const [hoverIdx, setHoverIdx] = useState<number | null>(null)

    const isHovering = !!hoverIdx || hoverIdx === 0
    const balance = isHovering ? data[hoverIdx].balance : acc.balance
    const hoverDate = isHovering ? data[hoverIdx].date : null

    const offset =
      dataMax <= 0 ? 0 : dataMin >= 0 ? 1 : dataMax / (dataMax - dataMin)
    const colorId = 'gradient' + acc.id.replace(/[^a-zA-Z0-9]/g, '')

    return (
      <div className="surface-card shadow-elevation-1 relative mb-2 overflow-hidden">
        <div className="relative z-[1] min-w-40 pointer-events-none p-4">
          <Typography variant="body2">
            <span
              style={{ textDecoration: acc.archive ? 'line-through' : 'none' }}
            >
              {acc.title}
            </span>{' '}
            {isHovering && hoverDate && formatDate(hoverDate)}
          </Typography>
          <Typography variant="h6">
            <Amount value={balance} currency={acc.fxCode} decimals="ifAny" />
          </Typography>
        </div>
        <div
          style={{
            width: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          <ResponsiveContainer>
            <AreaChart
              data={data}
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
              onClick={e => {
                if (!e || !e.activeLabel) return
                const date = data[+e.activeLabel].date
                onClick(id, date)
              }}
              onMouseMove={e => {
                if (!e || !e.activeLabel) {
                  setHoverIdx(null)
                  return
                }
                setHoverIdx(+e.activeLabel)
              }}
              onMouseLeave={() => setHoverIdx(null)}
            >
              <defs>
                <linearGradient id={colorId} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset={offset}
                    stopColor={theme.palette.primary.main}
                    stopOpacity={0.2}
                  />
                  <stop
                    offset={offset}
                    stopColor={theme.palette.error.main}
                    stopOpacity={0.3}
                  />
                </linearGradient>
              </defs>

              <YAxis domain={[yAxisMin, 'dataMax']} hide />

              <Area
                type="monotone"
                stroke="none"
                fill={`url(#${colorId})`}
                fillOpacity={1}
                dataKey="balance"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }
)

const sortAccountsByBalance = (
  accounts: core.accounts.TAccountPopulated[],
  toDisplay: (amount: TFxAmount) => number
): core.accounts.TAccountPopulated[] => {
  return [...accounts].sort(
    (a, b) =>
      toDisplay({ [b.fxCode]: b.balance }) -
      toDisplay({ [a.fxCode]: a.balance })
  )
}

function getTotal(accs: core.accounts.TAccountPopulated[]): TFxAmount {
  if (!accs.length) return {}

  return accs.reduce(
    (sum, a) => addFxAmount(sum, { [a.fxCode]: a.balance }),
    {}
  )
}
