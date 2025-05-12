import type { TDateDraft, TFxAmount, TISOMonth } from '6-shared/types'

import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemButton,
  useTheme,
} from '@mui/material'
import { Total } from '6-shared/ui/Total'
import { Amount } from '6-shared/ui/Amount'
import {
  formatDate,
  parseDate,
  prevMonth,
  toISOMonth,
} from '6-shared/helpers/date'

import { TEnvelopeId } from '5-entities/envelope'
import { balances, TrFilterMode } from '5-entities/envBalances'
import { fxRateModel } from '5-entities/currency/fxRate'
import { useEnvTransactionsDrawer } from '3-widgets/global/EnvTransactionsDrawer'
import { OneLiner } from '3-widgets/DataLine'
import { cardStyle } from './shared'
import { useBudgetPopover } from '../BudgetPopover'

const getMonthNum = (month: TISOMonth | TDateDraft) =>
  parseDate(month).getMonth() + 1

export function EnvelopeInfo(props: { month: TISOMonth; id: TEnvelopeId }) {
  const { month, id } = props
  const { t } = useTranslation('budgets')
  const theme = useTheme()
  const transactionDrawer = useEnvTransactionsDrawer()
  const openBudgetPopover = useBudgetPopover()
  const convertFx = fxRateModel.useConverter()
  const envMetrics = balances.useEnvData()[month][id]

  if (!envMetrics) return null

  const { currency } = envMetrics
  const toEnvelope = (a: TFxAmount) => convertFx(a, currency, month)
  const totalLeftover = toEnvelope(envMetrics.totalLeftover)
  const totalBudgeted = toEnvelope(envMetrics.totalBudgeted)
  const totalActivity = toEnvelope(envMetrics.totalActivity)
  const totalAvailable = toEnvelope(envMetrics.totalAvailable)

  const currentMonth = toISOMonth(new Date())

  const blockTitle =
    currentMonth === month
      ? t('availableTitleNow')
      : month > currentMonth
        ? t('availableTitleFuture', { context: getMonthNum(month).toString() })
        : t('availableTitlePast', { context: getMonthNum(month).toString() })

  return (
    <Box
      sx={{
        ...cardStyle,
        '--color': theme.palette.text.secondary,
      }}
    >
      <Stack spacing={1.5} py={1}>
        <Total
          title={blockTitle}
          value={totalAvailable}
          decMode="ifAny"
          currency={currency}
          noShade
          amountColor={
            totalAvailable < 0
              ? 'error.main'
              : totalAvailable > 0
                ? 'success.main'
                : undefined
          }
        />
        <Divider light />
      </Stack>
      <List dense sx={{ mx: -2, color: 'text.secondary' }}>
        <ListItem>
          <OneLiner
            left={t('leftoverFrom', {
              month: formatDate(prevMonth(month), 'MMM'),
            })}
            right={
              <Amount
                value={totalLeftover}
                currency={currency}
                decMode="ifAny"
              />
            }
          />
        </ListItem>

        <ListItemButton
          sx={{
            '&:hover': { color: 'text.primary' },
            transition: '.2s ease-in-out',
          }}
          onClick={e => openBudgetPopover(id, e.currentTarget)}
        >
          <OneLiner
            left={t('budget', { ns: 'common' })}
            right={
              <Amount
                value={totalBudgeted}
                currency={currency}
                decMode="ifAny"
              />
            }
          />
        </ListItemButton>

        <ListItemButton
          sx={{
            '&:hover': { color: 'text.primary' },
            transition: '.2s ease-in-out',
          }}
          onClick={() => {
            transactionDrawer.open({
              envelopeConditions: { id, month, mode: TrFilterMode.Envelope },
            })
          }}
        >
          <OneLiner
            left={
              <span>
                <span>{t('transactions', { ns: 'common' })}</span>
                {Boolean(envMetrics.totalTransactions.length) && (
                  <span style={{ opacity: 0.5 }}>
                    {' ' + envMetrics.totalTransactions.length}
                  </span>
                )}
              </span>
            }
            right={
              <Amount
                value={totalActivity}
                currency={currency}
                decMode="ifAny"
              />
            }
          />
        </ListItemButton>
      </List>
    </Box>
  )
}
