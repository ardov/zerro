import React, { FC, useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Typography, Paper, List, ListSubheader, Collapse } from '@mui/material'
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts'
import { useAppTheme } from '6-shared/ui/theme'
import { formatDate, toISOMonth } from '6-shared/helpers/date'
import { TAccountId, TISODate, TFxAmount } from '6-shared/types'
import { Amount } from '6-shared/ui/Amount'
import { useToggle } from '6-shared/hooks/useToggle'
import { addFxAmount } from '6-shared/helpers/money'
import { Tooltip } from '6-shared/ui/Tooltip'
import { accountModel, TAccountPopulated } from '5-entities/account'
import { DisplayAmount, displayCurrency } from '5-entities/currency/displayCurrency'
import { Period } from '../shared/period'
import { useAccountHistory } from './model'
import {
  useTransactionDrawer
} from "../../../3-widgets/global/TransactionListDrawer";

type WidgetAccHistoryProps = {
  period: Period
}

const SUBHEADER_MARGIN_BOTTOM = 1
const ACCOUNT_MARGIN_BOTTOM = 8

const sortAccountsByBalance = (
  accounts: TAccountPopulated[],
  toDisplay: (amount: TFxAmount) => number
): TAccountPopulated[] => {
  return [...accounts].sort(
    (a, b) =>
      toDisplay({ [b.fxCode]: b.balance }) -
      toDisplay({ [a.fxCode]: a.balance })
  )
}

export const WidgetAccHistory: FC<WidgetAccHistoryProps> = ({ period }) => {
  const { t } = useTranslation('accounts')
  const toDisplay = displayCurrency.useToDisplay(toISOMonth(new Date()))
  const trDrawer = useTransactionDrawer()

  const onClick = useCallback((id: TAccountId, date: TISODate) => {
    trDrawer.open({ filterConditions: { account: id }, initialDate: date })
  }, [trDrawer])

  const inBudgetAccounts = accountModel.useInBudgetAccounts()
  const savingAccounts = accountModel.useSavingAccounts()
  const {
    inBudget,
    inBudgetActive,
    inBudgetArchived,
    savings,
    savingsActive,
    savingsArchived
  } = useMemo(() => {
    const inBudget = sortAccountsByBalance(inBudgetAccounts, toDisplay)
    const savings = sortAccountsByBalance(savingAccounts, toDisplay)

    return {
      inBudget,
      inBudgetActive: inBudget.filter(a => !a.archive),
      inBudgetArchived: inBudget.filter(a => a.archive),
      savings,
      savingsActive: savings.filter(a => !a.archive),
      savingsArchived: savings.filter(a => a.archive)
    }
  }, [inBudgetAccounts, savingAccounts, toDisplay])

  return (
    <div>
      <List dense>
        <Subheader
          name={
            <Tooltip title={t('inBalanceDescription')}>
              <span>{t('inBalance')}</span>
            </Tooltip>
          }
          amount={getTotal(inBudget)}
        />
        {inBudgetActive.map(acc => (
          <AccountHistoryWidget key={acc.id} id={acc.id} period={period} onClick={onClick} />
        ))}
        <ArchivedList accs={inBudgetArchived} period={period} onClick={onClick} />
      </List>

      <List dense>
        <Subheader
          name={
            <Tooltip title={t('otherDescription')}>
              <span>{t('other')}</span>
            </Tooltip>
          }
          amount={getTotal(savings)}
        />
        {savingsActive.map(acc => (
          <AccountHistoryWidget key={acc.id} id={acc.id} period={period} onClick={onClick} />
        ))}
      </List>

      <ArchivedList accs={savingsArchived} period={period} onClick={onClick} />
    </div>
  )
}

const ArchivedList: FC<{
  accs: TAccountPopulated[],
  period: Period,
  onClick: (id: TAccountId, date: TISODate) => void
}> = props => {
  const { t } = useTranslation('accounts')
  const { accs, period, onClick } = props
  const [visible, toggleVisibility] = useToggle()
  if (!accs.length) return null

  const sum = getTotal(accs)

  return (
    <List dense>
      <Subheader
        name={t('archived')}
        amount={sum}
        onClick={toggleVisibility}
      />
      <Collapse in={visible} unmountOnExit>
        <List dense disablePadding>
          {accs.map(acc => (
            <AccountHistoryWidget key={acc.id} id={acc.id} period={period} onClick={onClick} />
          ))}
        </List>
      </Collapse>
    </List>
  )
}

function getTotal(accs: TAccountPopulated[]): TFxAmount {
  return accs.reduce(
    (sum, a) => addFxAmount(sum, { [a.fxCode]: a.balance }),
    {}
  )
}

const Subheader: FC<{
  name: React.ReactNode
  amount: TFxAmount
  onClick?: () => void
}> = ({ name, amount, onClick }) => {
  const month = toISOMonth(new Date())
  const toDisplay = displayCurrency.useToDisplay(month)
  const isNegative = toDisplay(amount) < 0
  return (
    <ListSubheader
      sx={{
        borderRadius: 1,
        marginBottom: SUBHEADER_MARGIN_BOTTOM,
        cursor: onClick ? 'pointer' : 'default'
      }}
      onClick={onClick}
    >
      <Box component="span" display="flex" width="100%">
        <Typography
          component="span"
          noWrap
          sx={{ flexGrow: 1, lineHeight: 'inherit' }}
        >
          <b>{name}</b>
        </Typography>

        <Box
          component="span"
          ml={2}
          color={isNegative ? 'error.main' : 'text.secondary'}
        >
          <b>
            <DisplayAmount
              month={month}
              value={amount}
              decMode="ifOnly"
              noShade
            />
          </b>
        </Box>
      </Box>
    </ListSubheader>
  )
}

type AccTrendProps = {
  period: Period
  id: TAccountId
  onClick: (id: TAccountId, date: TISODate) => void
}

const AccountHistoryWidget: FC<AccTrendProps> = ({
  id,
  period,
  onClick,
}) => {
  const theme = useAppTheme()
  const acc = accountModel.usePopulatedAccounts()[id]
  const data = useAccountHistory(id, period)
  const dataMax = Math.max(...data.map(i => i.balance))
  const dataMin = Math.min(...data.map(i => i.balance))
  const yAxisMin = Math.min(0, dataMin)

  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  const isHovering = !!hoverIdx || hoverIdx === 0
  const balance = isHovering ? data[hoverIdx].balance : acc.balance
  const hoverDate = isHovering ? data[hoverIdx].date : null

  const offset = dataMax <= 0 ? 0 : dataMin >= 0 ? 1 : dataMax / (dataMax - dataMin)
  const colorId = 'gradient' + acc.id

  return (
    <Paper style={{ overflow: 'hidden', position: 'relative', marginBottom: ACCOUNT_MARGIN_BOTTOM }}>
      <Box p={2} minWidth={160}>
        <Typography variant="body2">
          <span
            style={{ textDecoration: acc.archive ? 'line-through' : 'none' }}
          >
            {acc.title}
          </span>{' '}
          {isHovering && hoverDate && formatDate(hoverDate)}
        </Typography>
        <Typography variant="h6">
          <Amount value={balance} currency={acc.fxCode} decMode="ifAny" />
        </Typography>
      </Box>

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
    </Paper>
  )
}
