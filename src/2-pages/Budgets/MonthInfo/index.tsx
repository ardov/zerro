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

type MonthInfoProps = BoxProps & { onClose: () => void }

export const MonthInfo: FC<MonthInfoProps> = ({ onClose, ...rest }) => {
  const [month] = useMonth()
  const isMobile = useMediaQuery<Theme>(theme => theme.breakpoints.down('md'))
  const { overspend } = balances.useTotals()[month]

  const dispatch = useAppDispatch()

  const copyAllBudgets = useConfirm({
    onOk: () => dispatch(copyPreviousBudget(month)),
    title: 'Скопировать все бюджеты?',
    description: 'Бюджеты будут точно такими же, как в предыдущем месяце.',
    okText: 'Скопировать',
    cancelText: 'Отмена',
  })

  const fixOverspends = useConfirm({
    onOk: () => dispatch(overspendModel.fixAll(month)),
    title: 'Избавиться от перерасходов?',
    okText: 'Покрыть перерасходы',
    cancelText: 'Отмена',
  })

  const startAgain = useConfirm({
    onOk: () => dispatch(startFresh(month)),
    title: 'Хотите начать всё заново?',
    description:
      'Остатки во всех категориях сбросятся, а бюджеты в будущем удалятся. Вы сможете начать распределять деньги с чистого листа. Меняются только бюджеты, все остальные данные останутся как есть.',
    okText: 'Сбросить остатки',
    cancelText: 'Отмена',
  })

  return (
    <Box {...rest} minHeight="100vh">
      {isMobile && (
        <Box py={1} px={3} display="flex" alignItems="center">
          <Box flexGrow={1}>
            <Typography variant="h6" noWrap>
              {getMonthName(month)}
            </Typography>
          </Box>

          <Tooltip title="Закрыть">
            <IconButton edge="end" onClick={onClose} children={<CloseIcon />} />
          </Tooltip>
        </Box>
      )}

      <Stack gap={2} p={3}>
        <OverspendNotice month={month} />

        <BalanceWidget month={month} />
        <ActivityStats month={month} />
        <FxRates month={month} />

        <Box p={2} bgcolor="background.default" borderRadius={1}>
          <Box mb={1}>
            <Typography variant="body1" align="center">
              Действия
            </Typography>
          </Box>

          <Button fullWidth color="secondary" onClick={copyAllBudgets}>
            Копировать с прошлого месяца
          </Button>

          {!isZero(overspend) && (
            <Button fullWidth color="secondary" onClick={fixOverspends}>
              <span>
                Покрыть перерасходы (
                <DisplayAmount value={overspend} month={month} />)
              </span>
            </Button>
          )}

          <GoalAction month={month} />

          <Button fullWidth color="secondary" onClick={startAgain}>
            Сбросить все остатки
          </Button>
        </Box>
      </Stack>
    </Box>
  )
}

const getMonthName = (date: TDateDraft) =>
  formatDate(new Date(date), 'LLLL').toUpperCase()

function GoalAction(props: { month: TISOMonth }) {
  const dispatch = useAppDispatch()
  const { month } = props
  const { progress, goalsCount } = goalModel.useTotals()[month]
  const canComplete = progress < 1 && goalsCount > 0

  const completeAll = useConfirm({
    onOk: () => dispatch(totalGoalsModel.fillAll(month)),
    title: 'Выполнить все цели?',
    description:
      'Бюджеты будут выставлены так, чтобы цели в этом месяце выполнились.',
    okText: 'Выполнить цели',
    cancelText: 'Отмена',
  })

  if (!canComplete) return null

  return (
    <Button fullWidth color="secondary" onClick={completeAll}>
      Выполнить все цели
    </Button>
  )
}
