import React, { FC } from 'react'
import { useAppDispatch, useAppSelector } from '@store'
import { formatMoney } from '@shared/helpers/money'
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
import { useMonth } from '@pages/BudgetsOld/pathHooks'
import { TDateDraft } from '@shared/types'
import {
  overspendModel,
  OverspendNotice,
} from '@features/bulkActions/fixOverspend'
import { copyPreviousBudget } from '@features/bulkActions/copyPrevMonth'
import { BalanceWidget } from '@pages/Budgets/widgets/BalanceWidget'
import { StatWidget } from '@pages/Budgets/widgets/StatWidget'

type MonthInfoProps = BoxProps & {
  onClose: () => void
}

export const MonthInfo: FC<MonthInfoProps> = ({ onClose, ...rest }) => {
  const [month] = useMonth()

  const isMobile = useMediaQuery<Theme>(theme => theme.breakpoints.down('md'))
  const { totalOverspendValue, currency } = useAppSelector(
    overspendModel.get
  )?.[month]

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
        <StatWidget month={month} mode="income" />
        <StatWidget month={month} mode="outcome" />

        <Box p={2} bgcolor="background.default" borderRadius={1}>
          <Box mb={1}>
            <Typography variant="body1" color="textSecondary" align="center">
              Быстрые бюджеты
            </Typography>
          </Box>
          <Confirm
            title="Скопировать все бюджеты?"
            description="Бюджеты будут точно такими же, как в предыдущем месяце."
            onOk={() => dispatch(copyPreviousBudget(month))}
            okText="Скопировать"
            cancelText="Отмена"
          >
            <Button fullWidth color="secondary">
              Копировать с прошлого месяца
            </Button>
          </Confirm>

          {!!totalOverspendValue && (
            <Confirm
              title="Избавиться от перерасходов?"
              onOk={() => dispatch(overspendModel.fixAll(month))}
              okText="Покрыть перерасходы"
              cancelText="Отмена"
            >
              <Button fullWidth color="secondary">
                Покрыть перерасходы (
                {formatMoney(totalOverspendValue, currency)})
              </Button>
            </Confirm>
          )}

          <Confirm
            title="Хотите начать всё заново?"
            description="Остатки во всех категориях сбросятся, а бюджеты в будущем удалятся. Вы сможете начать распределять деньги с чистого листа. Меняются только бюджеты, все остальные данные останутся как есть."
            onOk={() => dispatch(startFresh(month))}
            okText="Сбросить остатки"
            cancelText="Отмена"
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
