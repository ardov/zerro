import React, { FC } from 'react'
import { useAppDispatch } from 'store'
import { isZero } from '6-shared/helpers/money'
import { formatDate } from '6-shared/helpers/date'
import { startFresh } from '4-features/bulkActions/startFresh'
import {
  Box,
  Typography,
  Button,
  IconButton,
  useMediaQuery,
  Theme,
  BoxProps,
  Stack,
} from '@mui/material'
import { CloseIcon } from '6-shared/ui/Icons'
import { Tooltip } from '6-shared/ui/Tooltip'
import { TDateDraft, TISOMonth } from '6-shared/types'

import { balances } from '5-entities/envBalances'
import { DisplayAmount } from '5-entities/currency/displayCurrency'
import {
  overspendModel,
  OverspendNotice,
} from '4-features/bulkActions/fixOverspend'
import { copyPreviousBudget } from '4-features/bulkActions/copyPrevMonth'
import { useMonth } from '../MonthProvider'
import { BalanceWidget } from '../BalanceWidget'
import { FxRates } from './FxRates'
import { ActivityStats } from './ActivityStats'
import { goalModel } from '5-entities/goal'
import { totalGoalsModel } from '4-features/bulkActions/fillGoals'
import { useConfirm } from '6-shared/ui/SmartConfirm'
import { useTranslation } from 'react-i18next'

type MonthInfoProps = BoxProps & { onClose: () => void }

export const MonthInfo: FC<MonthInfoProps> = ({ onClose, ...rest }) => {
  const { t } = useTranslation('budgets', { keyPrefix: 'actions' })
  const [month] = useMonth()
  const isMobile = useMediaQuery<Theme>(theme => theme.breakpoints.down('md'))
  const { overspend } = balances.useTotals()[month]

  const dispatch = useAppDispatch()

  const copyAllBudgets = useConfirm({
    onOk: () => dispatch(copyPreviousBudget(month)),
    title: t('copyAllBudgets.title'),
    description: t('copyAllBudgets.description'),
    okText: t('copyAllBudgets.okText'),
    cancelText: t('copyAllBudgets.cancelText'),
  })

  const fixOverspends = useConfirm({
    onOk: () => dispatch(overspendModel.fixAll(month)),
    title: t('fixOverspends.title'),
    okText: t('fixOverspends.okText'),
    cancelText: t('fixOverspends.cancelText'),
  })

  const startAgain = useConfirm({
    onOk: () => dispatch(startFresh(month)),
    title: t('startAgain.title'),
    description: t('startAgain.description'),
    okText: t('startAgain.okText'),
    cancelText: t('startAgain.cancelText'),
  })

  return (
    <Box
      {...rest}
      sx={[
        {
          minHeight: '100vh',
        },
        ...(Array.isArray(rest.sx) ? rest.sx : [rest.sx]),
      ]}
    >
      {isMobile && (
        <Box
          sx={{
            py: 1,
            px: 3,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              flexGrow: 1,
            }}
          >
            <Typography variant="h6" noWrap>
              {getMonthName(month)}
            </Typography>
          </Box>

          <Tooltip title={t('close')}>
            <IconButton edge="end" onClick={onClose} children={<CloseIcon />} />
          </Tooltip>
        </Box>
      )}
      <Stack
        sx={{
          gap: 2,
          p: 3,
        }}
      >
        <OverspendNotice month={month} />

        <BalanceWidget month={month} />
        <ActivityStats month={month} />
        <FxRates month={month} />

        <Box
          sx={{
            p: 2,
            bgcolor: 'background.default',
            borderRadius: 1,
          }}
        >
          <Box
            sx={{
              mb: 1,
            }}
          >
            <Typography variant="body1" align="center">
              {t('actions')}
            </Typography>
          </Box>

          <Button fullWidth color="secondary" onClick={copyAllBudgets}>
            {t('copyAllBudgets.trigger')}
          </Button>

          {!isZero(overspend) && (
            <Button fullWidth color="secondary" onClick={fixOverspends}>
              <span>
                {t('fixOverspends.trigger')} (
                <DisplayAmount value={overspend} month={month} />)
              </span>
            </Button>
          )}

          <GoalAction month={month} />

          <Button fullWidth color="secondary" onClick={startAgain}>
            {t('startAgain.trigger')}
          </Button>
        </Box>
      </Stack>
    </Box>
  )
}

const getMonthName = (date: TDateDraft) =>
  formatDate(new Date(date), 'LLLL').toUpperCase()

function GoalAction(props: { month: TISOMonth }) {
  const { t } = useTranslation('budgets', {
    keyPrefix: 'actions.completeAllGoals',
  })
  const dispatch = useAppDispatch()
  const { month } = props
  const { progress, goalsCount } = goalModel.useTotals()[month]
  const canComplete = progress < 1 && goalsCount > 0

  const completeAll = useConfirm({
    onOk: () => dispatch(totalGoalsModel.fillAll(month)),
    title: t('title'),
    description: t('description'),
    okText: t('okText'),
    cancelText: t('cancelText'),
  })

  if (!canComplete) return null

  return (
    <Button fullWidth color="secondary" onClick={completeAll}>
      {t('trigger')}
    </Button>
  )
}
