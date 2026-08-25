import type { FC } from 'react'
import { core } from 'zerro-core/redux'

import { useAppSelector } from 'store'

import type { ButtonBaseProps } from '@mui/material'
import { Typography, ButtonBase, Divider } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from '6-shared/ui/theme'
import { sub } from '6-shared/helpers/money'
import { Tooltip } from '6-shared/ui/Tooltip'
import { Amount } from '6-shared/ui/Amount'
import { DataLine } from '3-widgets/DataLine'
import { ArrowForwardIcon } from '6-shared/ui/Icons'

import { useMonth } from '../../MonthProvider'
import { useIsSmall } from '../shared/shared'

type TMsgType = 'error' | 'warning' | 'success'

/** Shows funds that have not yet been assigned to a category. */
type ToBeAssignedProps = ButtonBaseProps

export const ToBeAssigned: FC<ToBeAssignedProps> = props => {
  const { t } = useTranslation('budgets')
  const {
    currency,
    toBeAssigned,
    hasFutureOverspend,
    msgType,
    TooltipContent,
  } = useTotalsModel()

  const theme = useAppTheme()
  const isSmall = useIsSmall()

  const bg = theme.palette[msgType].main
  const color = theme.palette.getContrastText(bg)

  return (
    <Tooltip arrow title={<TooltipContent />}>
      <ButtonBase
        sx={{
          display: 'flex',
          gap: 1,
          borderRadius: 1,
          py: 1,
          pl: 2,
          pr: 1,
          background: bg,
          color: color,
        }}
        {...props}
      >
        <Typography noWrap align="center" variant="body1">
          {!isSmall &&
            (toBeAssigned ? t('notAllocated') : t('allAllocated')) + ' '}
          {toBeAssigned ? (
            <Amount
              value={toBeAssigned}
              currency={currency}
              decimals="ifOnly"
              noShade
            />
          ) : hasFutureOverspend ? (
            '👍'
          ) : (
            '👌'
          )}
        </Typography>
        <ArrowForwardIcon fontSize="small" />
      </ButtonBase>
    </Tooltip>
  )
}

function useTotalsModel() {
  const { t } = useTranslation('budgets')
  const [month] = useMonth()

  const [currency] = core.currency.useDisplayCurrency()
  const toDisplay = core.currency.useToDisplay(month)

  const monthList = useAppSelector(core.months.selectList)
  const lastMonth = monthList[monthList.length - 1]

  const totals = useAppSelector(core.months.selectTotals)[month]
  const lastTotals = useAppSelector(core.months.selectTotals)[lastMonth]

  const toBeAssigned = toDisplay(totals.toBeAssigned)
  const overspend = toDisplay(totals.overspend)
  const hasFutureOverspend = toDisplay(lastTotals.overspend)
  const fundsEnd = toDisplay(totals.fundsEnd)
  const allocated = toDisplay(totals.available)
  const assignedInFuture = toDisplay(totals.assignedInFuture)

  const freeWithoutFuture = sub(fundsEnd, allocated)
  const displayAssignedInFuture =
    freeWithoutFuture < 0
      ? 0
      : assignedInFuture >= freeWithoutFuture
        ? freeWithoutFuture
        : assignedInFuture

  const msgType: TMsgType =
    toBeAssigned < 0 ? 'error' : overspend ? 'warning' : 'success'

  const messages = {
    success: toBeAssigned
      ? t('explainer.hasFreeMoney')
      : t('explainer.zeroToBeAssigned'),
    warning: t('explainer.overspend'),
    error: t('explainer.assignedMoreThanHave'),
  }

  function TooltipContent() {
    return (
      <div className="flex flex-col gap-2">
        <Typography variant="body2" align="center">
          {messages[msgType]}
        </Typography>
        <Divider />

        <DataLine name={t('inBalance')} amount={fundsEnd} currency={currency} />
        <Divider />

        <DataLine
          name={t('inEnvelopes')}
          amount={allocated}
          currency={currency}
        />
        <DataLine
          name={t('assignedInFuture')}
          amount={displayAssignedInFuture}
          currency={currency}
        />
        <DataLine
          name={t('toBeAssigned')}
          amount={toBeAssigned}
          currency={currency}
        />
      </div>
    )
  }

  return {
    currency,
    toBeAssigned,
    overspend,
    hasFutureOverspend,
    month,
    msgType,
    TooltipContent,
  }
}
