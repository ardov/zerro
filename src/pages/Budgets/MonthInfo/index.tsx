import React, { FC } from 'react'
import { useAppDispatch } from '@store'
import { isZero } from '@shared/helpers/money'
import { formatDate } from '@shared/helpers/date'
import { Confirm } from '@shared/ui/Confirm'
import { startFresh } from '@features/bulkActions/startFresh'
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
import { CloseIcon } from '@shared/ui/Icons'
import { Tooltip } from '@shared/ui/Tooltip'
import { TDateDraft, TISOMonth } from '@shared/types'

import { balances } from '@entities/envBalances'
import { DisplayAmount } from '@entities/currency/displayCurrency'
import {
  overspendModel,
  OverspendNotice,
} from '@features/bulkActions/fixOverspend'
import { copyPreviousBudget } from '@features/bulkActions/copyPrevMonth'
import { useMonth } from '../MonthProvider'
import { BalanceWidget } from '../BalanceWidget'
import { FxRates } from './FxRates'
import { ActivityStats } from './ActivityStats'
import { goalModel } from '@entities/goal'
import { totalGoalsModel } from '@features/bulkActions/fillGoals'

type MonthInfoProps = BoxProps & { onClose: () => void }

export const MonthInfo: FC<MonthInfoProps> = ({ onClose, ...rest }) => {
  const [month] = useMonth()
  const isMobile = useMediaQuery<Theme>(theme => theme.breakpoints.down('md'))
  const { overspend } = balances.useTotals()[month]

  const dispatch = useAppDispatch()

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
          <Confirm
            title="Скопировать все бюджеты?"
            description="Бюджеты будут точно такими же, как в предыдущем месяце."
            onOk={() => dispatch(copyPreviousBudget(month))}
            okText="Скопировать"
            cancelText="Отмена"
            elKey="copyBudgetsConfirm"
          >
            <Button fullWidth color="secondary">
              Копировать с прошлого месяца
            </Button>
          </Confirm>

          {!isZero(overspend) && (
            <Confirm
              title="Избавиться от перерасходов?"
              onOk={() => dispatch(overspendModel.fixAll(month))}
              okText="Покрыть перерасходы"
              cancelText="Отмена"
              elKey="coverOverspends2Confirm"
            >
              <Button fullWidth color="secondary">
                <span>
                  Покрыть перерасходы (
                  <DisplayAmount value={overspend} month={month} />)
                </span>
              </Button>
            </Confirm>
          )}

          <GoalAction month={month} />

          <Confirm
            title="Хотите начать всё заново?"
            description="Остатки во всех категориях сбросятся, а бюджеты в будущем удалятся. Вы сможете начать распределять деньги с чистого листа. Меняются только бюджеты, все остальные данные останутся как есть."
            onOk={() => dispatch(startFresh(month))}
            okText="Сбросить остатки"
            cancelText="Отмена"
            elKey="startFreshConfirm"
          >
            <Button fullWidth color="secondary">
              Сбросить все остатки
            </Button>
          </Confirm>
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

  if (!canComplete) return null

  return (
    <Confirm
      title="Выполнить все цели?"
      description="Бюджеты будут выставлены так, чтобы цели в этом месяце выполнились."
      okText="Выполнить цели"
      cancelText="Отмена"
      onOk={() => dispatch(totalGoalsModel.fillAll(month))}
      elKey="completeAllGoalsConfirm2"
    >
      <Button fullWidth color="secondary">
        Выполнить все цели
      </Button>
    </Confirm>
  )
}
